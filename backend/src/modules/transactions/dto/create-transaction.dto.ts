import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum TransactionTypeDto {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum RecurrenceTypeDto {
  ONE_OFF = 'ONE_OFF',
  RECURRING = 'RECURRING',
}

export enum RecurrenceIntervalDto {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateTransactionDto {
  @IsEnum(TransactionTypeDto)
  type: TransactionTypeDto;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  subCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(RecurrenceTypeDto)
  recurrence?: RecurrenceTypeDto;

  // recurrence = RECURRING iken zorunlu; motorun periyodu hesaplayabilmesi için gerekli.
  @ValidateIf((dto: CreateTransactionDto) => dto.recurrence === RecurrenceTypeDto.RECURRING)
  @IsEnum(RecurrenceIntervalDto)
  recurrenceInterval?: RecurrenceIntervalDto;

  // Madde 5.8 — işlemi bir hane üyesine bağlama (opsiyonel).
  @IsOptional()
  @IsString()
  householdMemberId?: string;
}
