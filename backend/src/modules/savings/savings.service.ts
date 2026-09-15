import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto.js';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto.js';
import { UpdateSavingGoalProgressDto } from './dto/update-saving-goal-progress.dto.js';

type PaceStatus = 'ON_TRACK' | 'BEHIND' | 'AHEAD' | 'NO_TARGET_DATE';

interface GoalLike {
  targetAmount: unknown;
  currentAmount: unknown;
  targetDate: Date | null;
  monthlyPlanAmount: unknown;
  createdAt: Date;
}

// Madde 5.9 — Birikim ve Finansal Hedef Yönetimi.
@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavingGoalDto) {
    const goal = await this.prisma.savingGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount ?? 0,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        monthlyPlanAmount: dto.monthlyPlanAmount,
      },
    });
    return this.serialize(goal);
  }

  async findAll(userId: string) {
    const goals = await this.prisma.savingGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return goals.map((goal) => this.serialize(goal));
  }

  async findOne(userId: string, id: string) {
    const goal = await this.findRaw(userId, id);
    return this.serialize(goal);
  }

  async update(userId: string, id: string, dto: UpdateSavingGoalDto) {
    await this.findRaw(userId, id);
    const goal = await this.prisma.savingGoal.update({
      where: { id },
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        monthlyPlanAmount: dto.monthlyPlanAmount,
      },
    });
    return this.serialize(goal);
  }

  async updateProgress(userId: string, id: string, dto: UpdateSavingGoalProgressDto) {
    const existing = await this.findRaw(userId, id);
    const nextAmount = Math.max(Number(existing.currentAmount) + dto.delta, 0);
    const goal = await this.prisma.savingGoal.update({ where: { id }, data: { currentAmount: nextAmount } });
    return this.serialize(goal);
  }

  async remove(userId: string, id: string) {
    await this.findRaw(userId, id);
    await this.prisma.savingGoal.delete({ where: { id } });
    return { message: 'Hedef silindi.' };
  }

  async summary(userId: string) {
    const goals = await this.prisma.savingGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const serialized = goals.map((goal) => this.serialize(goal));
    return {
      totalTargetAmount: serialized.reduce((sum, g) => sum + g.targetAmount, 0),
      totalCurrentAmount: serialized.reduce((sum, g) => sum + g.currentAmount, 0),
      goals: serialized,
    };
  }

  private async findRaw(userId: string, id: string) {
    const goal = await this.prisma.savingGoal.findUnique({ where: { id } });
    if (!goal) {
      throw new NotFoundException('Hedef bulunamadı.');
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException('Bu hedefe erişim yetkiniz yok.');
    }
    return goal;
  }

  private serialize<T extends GoalLike & { id: string; userId: string; name: string }>(goal: T) {
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const monthlyPlanAmount = goal.monthlyPlanAmount != null ? Number(goal.monthlyPlanAmount) : null;
    const remainingAmount = Math.max(targetAmount - currentAmount, 0);
    const progressPercentage = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 1000) / 10 : 0;
    const remainingDays = this.remainingDays(goal.targetDate);
    const requiredMonthlySaving = this.requiredMonthlySaving(remainingAmount, goal.targetDate);
    const paceStatus = this.paceStatus({
      targetAmount,
      currentAmount,
      remainingAmount,
      targetDate: goal.targetDate,
      monthlyPlanAmount,
      createdAt: goal.createdAt,
    });

    return {
      id: goal.id,
      userId: goal.userId,
      name: goal.name,
      targetAmount,
      currentAmount,
      targetDate: goal.targetDate,
      monthlyPlanAmount,
      remainingAmount,
      progressPercentage,
      remainingDays,
      requiredMonthlySaving,
      paceStatus,
      createdAt: goal.createdAt,
      updatedAt: (goal as { updatedAt?: Date }).updatedAt,
    };
  }

  private remainingDays(targetDate: Date | null): number | null {
    if (!targetDate) return null;
    const now = new Date();
    const diffMs = new Date(targetDate).setUTCHours(0, 0, 0, 0) - new Date(now).setUTCHours(0, 0, 0, 0);
    return Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)), 0);
  }

  private remainingMonths(targetDate: Date | null): number {
    const days = this.remainingDays(targetDate);
    if (days === null) return 0;
    return Math.max(days / 30, 1 / 30);
  }

  private requiredMonthlySaving(remainingAmount: number, targetDate: Date | null): number | null {
    if (!targetDate || remainingAmount <= 0) return remainingAmount > 0 ? remainingAmount : 0;
    const months = this.remainingMonths(targetDate);
    return Math.round((remainingAmount / months) * 100) / 100;
  }

  private paceStatus(params: {
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    targetDate: Date | null;
    monthlyPlanAmount: number | null;
    createdAt: Date;
  }): PaceStatus {
    const { targetAmount, currentAmount, remainingAmount, targetDate, monthlyPlanAmount, createdAt } = params;

    if (!targetDate) return 'NO_TARGET_DATE';
    if (remainingAmount === 0) return 'AHEAD';

    const now = new Date();
    if (new Date(targetDate).getTime() <= now.getTime()) return 'BEHIND';

    if (monthlyPlanAmount !== null) {
      const months = this.remainingMonths(targetDate);
      const required = remainingAmount / months;
      return monthlyPlanAmount >= required ? 'ON_TRACK' : 'BEHIND';
    }

    const totalMs = new Date(targetDate).getTime() - createdAt.getTime();
    if (totalMs <= 0) return 'BEHIND';
    const elapsedMs = now.getTime() - createdAt.getTime();
    const expectedProgress = Math.min(Math.max(elapsedMs / totalMs, 0), 1) * targetAmount;

    if (currentAmount >= expectedProgress * 1.05) return 'AHEAD';
    if (currentAmount >= expectedProgress) return 'ON_TRACK';
    return 'BEHIND';
  }
}
