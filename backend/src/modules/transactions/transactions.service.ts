import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { QueryTransactionDto } from './dto/query-transaction.dto.js';

// Madde 5.4 — Gelir ve Gider Yönetimi.
@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type,
        amount: dto.amount,
        category: dto.category,
        subCategory: dto.subCategory,
        description: dto.description,
        date: new Date(dto.date),
        recurrence: dto.recurrence ?? 'ONE_OFF',
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
    await this.findOne(userId, id);
    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
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
}
