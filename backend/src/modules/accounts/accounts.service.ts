import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAccountDto, AccountTypeDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';
import { QueryAccountDto } from './dto/query-account.dto.js';

const REQUIRED_FIELD_BY_TYPE: Record<AccountTypeDto, { field: keyof CreateAccountDto; label: string }> = {
  [AccountTypeDto.BANK]: { field: 'balance', label: 'balance' },
  [AccountTypeDto.CREDIT_CARD]: { field: 'cardLimit', label: 'cardLimit' },
  [AccountTypeDto.LOAN]: { field: 'loanAmount', label: 'loanAmount' },
  [AccountTypeDto.OVERDRAFT]: { field: 'overdraftLimit', label: 'overdraftLimit' },
};

// Madde 5.5 — Banka, Kredi Kartı, Kredi ve KMH Yönetimi.
@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto) {
    const required = REQUIRED_FIELD_BY_TYPE[dto.type];
    if (dto[required.field] === undefined) {
      throw new BadRequestException(`${dto.type} hesabı için '${required.label}' alanı zorunludur.`);
    }

    if (dto.type === AccountTypeDto.LOAN) {
      this.assertRemainingDebtValid(dto.loanAmount, dto.remainingDebt);
    }
    if (dto.type === AccountTypeDto.OVERDRAFT) {
      this.assertOverdraftUsageValid(dto.overdraftLimit, dto.usedAmount);
    }

    const account = await this.prisma.account.create({
      data: { ...this.toWriteData(dto), userId, type: dto.type, name: dto.name },
      select: this.accountSelect(),
    });
    return this.serialize(account);
  }

  async findAll(userId: string, query: QueryAccountDto) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, type: query.type },
      orderBy: { createdAt: 'desc' },
      select: this.accountSelect(),
    });
    return accounts.map((account) => this.serialize(account));
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.account.findUnique({ where: { id }, select: this.accountSelect() });
    if (!account) {
      throw new NotFoundException('Hesap bulunamadı.');
    }
    if (account.userId !== userId) {
      throw new ForbiddenException('Bu hesaba erişim yetkiniz yok.');
    }
    return this.serialize(account);
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    const existing = await this.findRaw(userId, id);
    const type = dto.type ?? existing.type;

    if (type === AccountTypeDto.LOAN) {
      const loanAmount = dto.loanAmount ?? (existing.loanAmount ? Number(existing.loanAmount) : undefined);
      const remainingDebt = dto.remainingDebt ?? (existing.remainingDebt ? Number(existing.remainingDebt) : undefined);
      this.assertRemainingDebtValid(loanAmount, remainingDebt);
    }
    if (type === AccountTypeDto.OVERDRAFT) {
      const overdraftLimit =
        dto.overdraftLimit ?? (existing.overdraftLimit != null ? Number(existing.overdraftLimit) : undefined);
      const usedAmount = dto.usedAmount ?? (existing.usedAmount != null ? Number(existing.usedAmount) : undefined);
      this.assertOverdraftUsageValid(overdraftLimit, usedAmount);
    }

    const account = await this.prisma.account.update({
      where: { id },
      data: this.toWriteData(dto, existing),
      select: this.accountSelect(),
    });
    return this.serialize(account);
  }

  async remove(userId: string, id: string) {
    await this.findRaw(userId, id);
    await this.prisma.account.delete({ where: { id } });
    return { message: 'Hesap silindi.' };
  }

  // Madde 5.3 — Ana ekran finansal özet (hesap toplamları).
  async summary(userId: string) {
    const accounts = await this.prisma.account.findMany({ where: { userId } });

    const banks = accounts.filter((a) => a.type === 'BANK');
    const cards = accounts.filter((a) => a.type === 'CREDIT_CARD');
    const loans = accounts.filter((a) => a.type === 'LOAN');
    const overdrafts = accounts.filter((a) => a.type === 'OVERDRAFT');

    const sum = (items: typeof accounts, field: keyof (typeof accounts)[number]) =>
      items.reduce((total, item) => total + Number(item[field] ?? 0), 0);

    return {
      totalBankBalance: sum(banks, 'balance'),
      totalCreditCardDebt: sum(cards, 'currentDebt'),
      totalCreditCardLimit: sum(cards, 'cardLimit'),
      totalAvailableCardLimit: sum(cards, 'availableLimit'),
      totalLoanRemainingDebt: sum(loans, 'remainingDebt'),
      totalMonthlyLoanInstallments: sum(loans, 'monthlyInstallment'),
      totalOverdraftLimit: sum(overdrafts, 'overdraftLimit'),
      totalOverdraftUsed: sum(overdrafts, 'usedAmount'),
    };
  }

  private async findRaw(userId: string, id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException('Hesap bulunamadı.');
    }
    if (account.userId !== userId) {
      throw new ForbiddenException('Bu hesaba erişim yetkiniz yok.');
    }
    return account;
  }

  private assertRemainingDebtValid(loanAmount?: number, remainingDebt?: number) {
    if (remainingDebt !== undefined && remainingDebt < 0) {
      throw new BadRequestException('Kalan borç negatif olamaz.');
    }
    if (loanAmount !== undefined && remainingDebt !== undefined && remainingDebt > loanAmount) {
      throw new BadRequestException('Kalan borç, kredi tutarından büyük olamaz.');
    }
  }

  private assertOverdraftUsageValid(overdraftLimit?: number, usedAmount?: number) {
    if (usedAmount !== undefined && usedAmount < 0) {
      throw new BadRequestException('Kullanılan tutar negatif olamaz.');
    }
    if (overdraftLimit !== undefined && usedAmount !== undefined && usedAmount > overdraftLimit) {
      throw new BadRequestException('Kullanılan tutar, KMH limitinden büyük olamaz.');
    }
  }

  // CREDIT_CARD için availableLimit her zaman sunucu tarafında hesaplanır — istemciden gelen değere güvenilmez.
  private toWriteData(dto: CreateAccountDto | UpdateAccountDto, existing?: { cardLimit: unknown; currentDebt: unknown }) {
    const cardLimit = dto.cardLimit ?? (existing?.cardLimit != null ? Number(existing.cardLimit) : undefined);
    const currentDebt = dto.currentDebt ?? (existing?.currentDebt != null ? Number(existing.currentDebt) : undefined);
    const availableLimit =
      cardLimit !== undefined ? Math.max(cardLimit - (currentDebt ?? 0), 0) : undefined;

    return {
      ...('type' in dto ? { type: dto.type } : {}),
      name: dto.name,
      bankName: dto.bankName,
      balance: dto.balance,
      cardLimit: dto.cardLimit,
      currentDebt: dto.currentDebt,
      availableLimit,
      statementDate: dto.statementDate ? new Date(dto.statementDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      minPaymentAmount: dto.minPaymentAmount,
      fullPaymentAmount: dto.fullPaymentAmount,
      loanAmount: dto.loanAmount,
      monthlyInstallment: dto.monthlyInstallment,
      remainingDebt: dto.remainingDebt ?? (dto.type === AccountTypeDto.LOAN ? dto.loanAmount : undefined),
      remainingInstallments: dto.remainingInstallments,
      overdraftLimit: dto.overdraftLimit,
      usedAmount: dto.usedAmount,
    };
  }

  private accountSelect() {
    return {
      id: true,
      userId: true,
      type: true,
      name: true,
      bankName: true,
      balance: true,
      cardLimit: true,
      currentDebt: true,
      availableLimit: true,
      statementDate: true,
      dueDate: true,
      minPaymentAmount: true,
      fullPaymentAmount: true,
      loanAmount: true,
      monthlyInstallment: true,
      remainingDebt: true,
      remainingInstallments: true,
      overdraftLimit: true,
      usedAmount: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  // OVERDRAFT kalan limiti kalıcı bir alan değil — response'ta türetilir.
  private serialize<T extends { type: string; overdraftLimit: unknown; usedAmount: unknown }>(account: T) {
    if (account.type !== 'OVERDRAFT') {
      return account;
    }
    const overdraftLimit = Number(account.overdraftLimit ?? 0);
    const usedAmount = Number(account.usedAmount ?? 0);
    return { ...account, remainingOverdraftLimit: Math.max(overdraftLimit - usedAmount, 0) };
  }
}
