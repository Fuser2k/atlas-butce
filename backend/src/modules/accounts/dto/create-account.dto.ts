import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export enum AccountTypeDto {
  BANK = 'BANK',
  CREDIT_CARD = 'CREDIT_CARD',
  LOAN = 'LOAN',
  OVERDRAFT = 'OVERDRAFT',
}

// Madde 5.5 — Banka, Kredi Kartı, Kredi ve KMH Yönetimi.
// Alan tipleri burada doğrulanır; "type'a göre hangi alan zorunlu" kuralı
// AccountsService.create() içinde uygulanır (bkz. REQUIRED_FIELDS_BY_TYPE).
export class CreateAccountDto {
  @IsEnum(AccountTypeDto)
  type: AccountTypeDto;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  // BANK
  @IsOptional()
  @IsNumber()
  balance?: number;

  // CREDIT_CARD
  @IsOptional()
  @IsNumber()
  @Min(0)
  cardLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentDebt?: number;

  @IsOptional()
  @IsDateString()
  statementDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPaymentAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fullPaymentAmount?: number;

  // LOAN
  @IsOptional()
  @IsNumber()
  @Min(0)
  loanAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyInstallment?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingDebt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  remainingInstallments?: number;

  // OVERDRAFT / KMH
  @IsOptional()
  @IsNumber()
  @Min(0)
  overdraftLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedAmount?: number;
}
