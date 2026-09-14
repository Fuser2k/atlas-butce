import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import { UpdateBillDto } from './dto/update-bill.dto.js';
import { QueryBillDto } from './dto/query-bill.dto.js';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto.js';

// Madde 5.6 / 5.7 — Faturalar, Sabit Ödemeler ve Ödeme Hatırlatıcıları.
//
// Teknik borç notu: Bill modelinde ödeme geçmişi tutulmuyor. Tekrar eden bir
// fatura "ödendi" işaretlendiğinde aynı kayıt bir sonraki döneme ilerletilir
// (dueDate ileri alınır, isPaid tekrar false olur). Bu, ayrı bir ödeme geçmişi
// tablosu gerektirmeyen minimum güvenilir mekanizmadır; geçmiş ödeme kayıtları
// gerekiyorsa (ör. "Ocak ayı kirası ödendi" arşivi) ayrı bir PaymentHistory
// modeli ile genişletilmelidir (Hafta 4+ kapsamı).
@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateBillDto) {
    return this.prisma.bill.create({
      data: {
        userId,
        name: dto.name,
        category: dto.category,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        recurrencePeriod: dto.recurrencePeriod ?? 'NONE',
        isPaid: dto.isPaid ?? false,
      },
    });
  }

  findAll(userId: string, query: QueryBillDto) {
    return this.prisma.bill.findMany({
      where: {
        userId,
        category: query.category,
        isPaid: query.isPaid !== undefined ? query.isPaid === 'true' : undefined,
        dueDate: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  findUpcoming(userId: string, days: number) {
    const now = new Date();
    const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.bill.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { gte: now, lte: horizon },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) {
      throw new NotFoundException('Fatura/ödeme bulunamadı.');
    }
    if (bill.userId !== userId) {
      throw new ForbiddenException('Bu kayda erişim yetkiniz yok.');
    }
    return bill;
  }

  async update(userId: string, id: string, dto: UpdateBillDto) {
    await this.findOne(userId, id);
    return this.prisma.bill.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateStatus(userId: string, id: string, dto: UpdateBillStatusDto) {
    const bill = await this.findOne(userId, id);

    if (dto.isPaid && bill.recurrencePeriod && bill.recurrencePeriod !== 'NONE') {
      return this.prisma.bill.update({
        where: { id },
        data: {
          isPaid: false,
          dueDate: this.addInterval(bill.dueDate, bill.recurrencePeriod as 'WEEKLY' | 'MONTHLY' | 'YEARLY'),
        },
      });
    }

    return this.prisma.bill.update({ where: { id }, data: { isPaid: dto.isPaid } });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.bill.delete({ where: { id } });
    return { message: 'Kayıt silindi.' };
  }

  private addInterval(date: Date, interval: 'WEEKLY' | 'MONTHLY' | 'YEARLY'): Date {
    const result = new Date(date);
    if (interval === 'WEEKLY') {
      result.setUTCDate(result.getUTCDate() + 7);
    } else if (interval === 'MONTHLY') {
      result.setUTCMonth(result.getUTCMonth() + 1);
    } else {
      result.setUTCFullYear(result.getUTCFullYear() + 1);
    }
    return result;
  }
}
