import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import { QueryTransactionDto } from '../transactions/dto/query-transaction.dto.js';
import { PlanningService } from '../planning/planning.service.js';

export type BriefingItemType = 'PAYMENT' | 'BUDGET' | 'SAVINGS' | 'GENERAL';
export type BriefingPriority = 'INFO' | 'WARNING';

export interface BriefingItem {
  type: BriefingItemType;
  text: string;
  priority: BriefingPriority;
}

const currency = (value: number) => `${value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺`;

// Madde 5.3 — Yazılı günlük ATLAS brifingi. AI kullanmaz; kullanıcının gerçek
// verilerinden deterministic (kural tabanlı) kısa metin üretir. Yatırım/kredi
// tavsiyesi vermez, korkutucu dil kullanmaz, veri yoksa nötr bilgi gösterir.
@Injectable()
export class BriefingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly planningService: PlanningService,
  ) {}

  async dailyBriefing(userId: string) {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [accountsSummary, transactionsSummary, expenseDistribution, plan, overdueBills, goals] = await Promise.all(
      [
        this.accountsService.summary(userId),
        this.transactionsService.summary(userId, Object.assign(new QueryTransactionDto(), { from: monthStart })),
        this.transactionsService.distribution(userId, 'EXPENSE'),
        this.planningService.monthlyPaymentPlan(userId),
        this.prisma.bill.findMany({ where: { userId, isPaid: false, dueDate: { lt: now } } }),
        this.prisma.savingGoal.findMany({ where: { userId } }),
      ],
    );

    const items: BriefingItem[] = [];

    // Gecikmiş ödeme
    if (overdueBills.length > 0) {
      const total = overdueBills.reduce((sum, b) => sum + Number(b.amount), 0);
      items.push({
        type: 'PAYMENT',
        text: `${overdueBills.length} adet gecikmiş ödemeniz var, toplam ${currency(total)}.`,
        priority: 'WARNING',
      });
    }

    // Yaklaşan ödemeler (7 gün içinde)
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = plan.items.filter((item) => item.date <= in7Days);
    if (upcoming.length > 0) {
      const total = upcoming.reduce((sum, item) => sum + item.amount, 0);
      items.push({
        type: 'PAYMENT',
        text: `Önümüzdeki 7 gün içinde ${upcoming.length} ödemeniz var, toplam ${currency(total)}.`,
        priority: 'WARNING',
      });
    } else {
      items.push({ type: 'PAYMENT', text: 'Önümüzdeki 7 gün içinde planlı bir ödemeniz görünmüyor.', priority: 'INFO' });
    }

    // Mevcut finansal durum
    items.push({
      type: 'BUDGET',
      text: `Bu ay toplam gelir ${currency(transactionsSummary.totalIncome)}, toplam gider ${currency(transactionsSummary.totalExpense)}.`,
      priority: 'INFO',
    });

    // Kullanılabilir para (V1 formülü: banka bakiyesi - 30 gün içindeki zorunlu ödemeler)
    const availableMoney = accountsSummary.totalBankBalance - plan.totalAmount;
    items.push({
      type: 'BUDGET',
      text: `Kullanılabilir paranız yaklaşık ${currency(availableMoney)}.`,
      priority: availableMoney < 0 ? 'WARNING' : 'INFO',
    });

    // En yüksek gider kategorisi
    if (expenseDistribution.items.length > 0) {
      const top = expenseDistribution.items[0];
      items.push({
        type: 'BUDGET',
        text: `Bu ay en yüksek gider kategoriniz "${top.category}" (${currency(top.amount)}, %${top.percentage}).`,
        priority: 'INFO',
      });
    }

    // Hedef ilerlemesi
    if (goals.length > 0) {
      const goal = goals[0];
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      const percentage = target > 0 ? Math.round((current / target) * 1000) / 10 : 0;
      items.push({
        type: 'SAVINGS',
        text: `"${goal.name}" hedefinizde ilerlemeniz %${percentage} (${currency(current)} / ${currency(target)}).`,
        priority: 'INFO',
      });
    }

    const headline =
      overdueBills.length > 0
        ? 'Dikkat: gecikmiş ödemeniz var.'
        : availableMoney < 0
          ? 'Bu ay zorunlu ödemeleriniz bakiyenizi aşabilir.'
          : 'Finansal durumunuz bugün için stabil görünüyor.';

    return {
      generatedAt: now.toISOString(),
      headline,
      items,
    };
  }
}
