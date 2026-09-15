import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { QueryTransactionDto } from './dto/query-transaction.dto.js';
import { HouseholdService } from '../household/household.service.js';

// Madde 5.4 — Gelir ve Gider Yönetimi.
@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly householdService: HouseholdService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const date = new Date(dto.date);
    const isRecurring = dto.recurrence === 'RECURRING';
    if (dto.householdMemberId) {
      await this.householdService.assertOwnedMember(userId, dto.householdMemberId);
    }

    return this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type,
        amount: dto.amount,
        category: dto.category,
        subCategory: dto.subCategory,
        description: dto.description,
        date,
        recurrence: dto.recurrence ?? 'ONE_OFF',
        recurrenceInterval: isRecurring ? dto.recurrenceInterval : undefined,
        nextOccurrenceDate: isRecurring ? this.addInterval(date, dto.recurrenceInterval!) : undefined,
        householdMemberId: dto.householdMemberId,
      },
    });
  }

  findAll(userId: string, query: QueryTransactionDto) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        type: query.type,
        category: query.category,
        date: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      throw new NotFoundException('İşlem bulunamadı.');
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException('Bu işleme erişim yetkiniz yok.');
    }
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(userId, id);
    if (dto.householdMemberId) {
      await this.householdService.assertOwnedMember(userId, dto.householdMemberId);
    }

    const nextRecurrence = dto.recurrence ?? existing.recurrence;
    const nextInterval = dto.recurrenceInterval ?? existing.recurrenceInterval ?? undefined;
    const nextDate = dto.date ? new Date(dto.date) : existing.date;
    const becomingRecurring = nextRecurrence === 'RECURRING';

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
        recurrenceInterval: becomingRecurring ? nextInterval : null,
        nextOccurrenceDate: becomingRecurring ? this.addInterval(nextDate, nextInterval!) : null,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
    return { message: 'İşlem silindi.' };
  }

  // Madde 5.3 — Ana ekran finansal özet (kısmi: hesap/fatura entegrasyonu sonraki haftalarda eklenecek).
  async summary(userId: string, query: QueryTransactionDto) {
    const transactions = await this.findAll(userId, query);

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpense,
      availableBalance: totalIncome - totalExpense,
    };
  }

  // Madde 5.3 — Bu ayki gelir/gider kategorilerine göre dağılım (Dashboard V3).
  async distribution(userId: string, type: 'INCOME' | 'EXPENSE') {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type, date: { gte: monthStart, lt: monthEnd } },
      select: { category: true, amount: true },
    });

    const totalsByCategory = new Map<string, number>();
    for (const t of transactions) {
      totalsByCategory.set(t.category, (totalsByCategory.get(t.category) ?? 0) + Number(t.amount));
    }
    const total = [...totalsByCategory.values()].reduce((sum, v) => sum + v, 0);

    const items = [...totalsByCategory.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { type, total, items };
  }

  // Tekrar eden işlem motoru: her gün çalışır, periyodu dolmuş şablonlar için yeni "çocuk"
  // işlem üretir ve şablonun bir sonraki tetiklenme tarihini ilerletir.
  // Not: recurrenceParentId dolu olan kayıtlar (üretilmiş çocuk işlemler) asla yeniden taranmaz.
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateDueRecurringTransactions() {
    const now = new Date();
    const dueTemplates = await this.prisma.transaction.findMany({
      where: {
        recurrence: 'RECURRING',
        recurrenceParentId: null,
        nextOccurrenceDate: { lte: now },
      },
    });

    for (const template of dueTemplates) {
      await this.prisma.transaction.create({
        data: {
          userId: template.userId,
          accountId: template.accountId,
          type: template.type,
          amount: template.amount,
          category: template.category,
          subCategory: template.subCategory,
          description: template.description,
          date: template.nextOccurrenceDate!,
          recurrence: 'ONE_OFF',
          recurrenceParentId: template.id,
          householdMemberId: template.householdMemberId,
        },
      });

      await this.prisma.transaction.update({
        where: { id: template.id },
        data: {
          nextOccurrenceDate: this.addInterval(template.nextOccurrenceDate!, template.recurrenceInterval!),
        },
      });
    }

    if (dueTemplates.length > 0) {
      this.logger.log(`${dueTemplates.length} tekrar eden işlem için yeni kayıt üretildi.`);
    }

    return { generated: dueTemplates.length };
  }

  private addInterval(date: Date, interval: 'WEEKLY' | 'MONTHLY'): Date {
    const result = new Date(date);
    if (interval === 'WEEKLY') {
      result.setUTCDate(result.getUTCDate() + 7);
    } else {
      result.setUTCMonth(result.getUTCMonth() + 1);
    }
    return result;
  }
}
