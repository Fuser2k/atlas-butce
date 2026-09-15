import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateHouseholdMemberDto } from './dto/create-household-member.dto.js';
import { UpdateHouseholdMemberDto } from './dto/update-household-member.dto.js';

// Madde 5.8 — Hane Halkı Yönetimi.
@Injectable()
export class HouseholdService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateHouseholdMemberDto) {
    return this.prisma.householdMember.create({ data: { userId, name: dto.name } });
  }

  findAll(userId: string) {
    return this.prisma.householdMember.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  async findOne(userId: string, id: string) {
    const member = await this.prisma.householdMember.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException('Hane üyesi bulunamadı.');
    }
    if (member.userId !== userId) {
      throw new ForbiddenException('Bu hane üyesine erişim yetkiniz yok.');
    }
    return member;
  }

  async update(userId: string, id: string, dto: UpdateHouseholdMemberDto) {
    await this.findOne(userId, id);
    return this.prisma.householdMember.update({ where: { id }, data: { name: dto.name } });
  }

  // Transaction.householdMemberId ilişkisi onDelete: SetNull ile tanımlı — geçmiş
  // gelir/gider kayıtları silinmez, yalnızca hane üyesi bağlantısı kaldırılır.
  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.householdMember.delete({ where: { id } });
    return { message: 'Hane üyesi silindi.' };
  }

  // Madde 5.3/5.8 — Kişi bazlı ve toplam hane bütçesi özeti.
  async summary(userId: string) {
    const [members, transactions] = await Promise.all([
      this.prisma.householdMember.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.transaction.findMany({
        where: { userId, householdMemberId: { not: null } },
        select: { householdMemberId: true, type: true, amount: true },
      }),
    ]);

    const memberSummaries = members.map((member) => {
      const own = transactions.filter((t) => t.householdMemberId === member.id);
      const income = own.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = own.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
      return { id: member.id, name: member.name, income, expense, net: income - expense };
    });

    const totalIncome = memberSummaries.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = memberSummaries.reduce((sum, m) => sum + m.expense, 0);

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      members: memberSummaries,
    };
  }

  // Transactions modülü, bir işlemi hane üyesine bağlarken bu metotla sahiplik doğrular.
  async assertOwnedMember(userId: string, householdMemberId: string) {
    const member = await this.prisma.householdMember.findUnique({ where: { id: householdMemberId } });
    if (!member || member.userId !== userId) {
      throw new ForbiddenException('Bu hane üyesi işleminize bağlanamaz.');
    }
  }
}
