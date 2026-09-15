import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma, ReminderSourceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

const REMINDER_WINDOWS_DAYS = [7, 3, 1, 0];

interface ReminderSource {
  sourceType: ReminderSourceType;
  sourceId: string;
  dueDate: Date;
  title: string;
  amount: number;
}

// Madde 5.7 — Ödeme Hatırlatıcıları. Fatura, kredi kartı, kredi ve KMH vade
// tarihlerini tek bir ortak "reminder" soyutlaması altında normalize eder;
// her kaynak türü için ayrı ayrı cron yazmak yerine tek motor kullanılır.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.paymentReminder.findMany({ where: { userId }, orderBy: { scheduledAt: 'desc' } });
  }

  findUpcoming(userId: string) {
    return this.prisma.paymentReminder.findMany({
      where: { userId, readAt: null },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async markRead(userId: string, id: string) {
    const reminder = await this.prisma.paymentReminder.findUnique({ where: { id } });
    if (!reminder) {
      throw new NotFoundException('Hatırlatma bulunamadı.');
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenException('Bu hatırlatmaya erişim yetkiniz yok.');
    }
    return this.prisma.paymentReminder.update({ where: { id }, data: { readAt: new Date() } });
  }

  // Her gün çalışır; kullanıcı bazlı doğrudan da çağrılabilir (test/manuel tetikleme için).
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateDueReminders(userId?: string) {
    const now = new Date();
    const userIds = userId
      ? [userId]
      : (await this.prisma.user.findMany({ select: { id: true } })).map((u) => u.id);

    let generated = 0;
    for (const uid of userIds) {
      const sources = await this.collectSources(uid);
      for (const source of sources) {
        for (const days of REMINDER_WINDOWS_DAYS) {
          const scheduledAt = new Date(source.dueDate);
          scheduledAt.setUTCDate(scheduledAt.getUTCDate() - days);
          scheduledAt.setUTCHours(0, 0, 0, 0);
          if (scheduledAt.getTime() > now.getTime()) continue;

          const created = await this.tryCreateReminder(uid, source, days, scheduledAt);
          if (created) generated++;
        }
      }
    }

    if (generated > 0) {
      this.logger.log(`${generated} yeni ödeme hatırlatması üretildi.`);
    }
    return { generated };
  }

  private async collectSources(userId: string): Promise<ReminderSource[]> {
    const [bills, accounts] = await Promise.all([
      this.prisma.bill.findMany({ where: { userId, isPaid: false } }),
      this.prisma.account.findMany({ where: { userId, dueDate: { not: null } } }),
    ]);

    const sources: ReminderSource[] = bills.map((bill) => ({
      sourceType: 'BILL' as ReminderSourceType,
      sourceId: bill.id,
      dueDate: bill.dueDate,
      title: bill.name,
      amount: Number(bill.amount),
    }));

    for (const account of accounts) {
      if (!account.dueDate) continue;
      if (account.type === 'CREDIT_CARD') {
        sources.push({
          sourceType: 'CREDIT_CARD',
          sourceId: account.id,
          dueDate: account.dueDate,
          title: account.name,
          amount: Number(account.minPaymentAmount ?? account.fullPaymentAmount ?? 0),
        });
      } else if (account.type === 'LOAN') {
        sources.push({
          sourceType: 'LOAN',
          sourceId: account.id,
          dueDate: account.dueDate,
          title: account.name,
          amount: Number(account.monthlyInstallment ?? 0),
        });
      } else if (account.type === 'OVERDRAFT') {
        sources.push({
          sourceType: 'OVERDRAFT',
          sourceId: account.id,
          dueDate: account.dueDate,
          title: account.name,
          amount: Number(account.usedAmount ?? 0),
        });
      }
    }

    return sources;
  }

  private async tryCreateReminder(
    userId: string,
    source: ReminderSource,
    days: number,
    scheduledAt: Date,
  ): Promise<boolean> {
    const label = days === 0 ? 'bugün' : `${days} gün içinde`;
    try {
      await this.prisma.paymentReminder.create({
        data: {
          userId,
          sourceType: source.sourceType,
          sourceId: source.sourceId,
          title: source.title,
          body: `${source.title} ödemesi ${label} vadesi doluyor (${source.amount.toFixed(2)} ₺).`,
          scheduledAt,
        },
      });
      return true;
    } catch (error) {
      // sourceType+sourceId+scheduledAt için unique kısıt — aynı hatırlatma daha önce
      // üretilmişse sessizce atla (duplicate prevention).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }
}
