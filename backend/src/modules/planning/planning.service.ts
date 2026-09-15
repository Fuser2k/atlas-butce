import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface MonthlyPaymentPlanItem {
  date: Date;
  type: 'BILL' | 'LOAN' | 'CREDIT_CARD' | 'OVERDRAFT';
  title: string;
  amount: number;
  paymentStatus: 'UPCOMING' | 'PAID';
}

// Madde 5.3/5.6/5.7 — Aylık ödeme planı. Fatura ve hesap (kredi/kart/KMH) vade
// tarihlerini tek bir kronolojik listede birleştirir; her kaynak yalnızca bir
// kez sayılır (aynı yükümlülük Bill ve Account tablolarında asla çakışmaz).
@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async monthlyPaymentPlan(userId: string): Promise<{ totalAmount: number; items: MonthlyPaymentPlanItem[] }> {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setUTCMonth(horizon.getUTCMonth() + 1);

    const [bills, accounts] = await Promise.all([
      this.prisma.bill.findMany({
        where: { userId, isPaid: false, dueDate: { gte: now, lte: horizon } },
      }),
      this.prisma.account.findMany({
        where: { userId, dueDate: { gte: now, lte: horizon } },
      }),
    ]);

    const items: MonthlyPaymentPlanItem[] = [
      ...bills.map((bill) => ({
        date: bill.dueDate,
        type: 'BILL' as const,
        title: bill.name,
        amount: Number(bill.amount),
        paymentStatus: 'UPCOMING' as const,
      })),
      ...accounts
        .filter((a) => a.type === 'LOAN')
        .map((a) => ({
          date: a.dueDate!,
          type: 'LOAN' as const,
          title: a.name,
          amount: Number(a.monthlyInstallment ?? 0),
          paymentStatus: 'UPCOMING' as const,
        })),
      ...accounts
        .filter((a) => a.type === 'CREDIT_CARD')
        .map((a) => ({
          date: a.dueDate!,
          type: 'CREDIT_CARD' as const,
          title: a.name,
          amount: Number(a.minPaymentAmount ?? a.fullPaymentAmount ?? 0),
          paymentStatus: 'UPCOMING' as const,
        })),
      ...accounts
        .filter((a) => a.type === 'OVERDRAFT')
        .map((a) => ({
          date: a.dueDate!,
          type: 'OVERDRAFT' as const,
          title: a.name,
          amount: Number(a.usedAmount ?? 0),
          paymentStatus: 'UPCOMING' as const,
        })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return { totalAmount: items.reduce((sum, item) => sum + item.amount, 0), items };
  }
}
