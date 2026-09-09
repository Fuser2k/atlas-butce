import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export enum TransactionTypeDto {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum RecurrenceTypeDto {
  ONE_OFF = 'ONE_OFF',
  RECURRING = 'RECURRING',
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
}
