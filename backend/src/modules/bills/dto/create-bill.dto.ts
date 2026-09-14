import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export enum RecurrencePeriodDto {
  NONE = 'NONE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

// Madde 5.6 / 5.7 — Faturalar ve Sabit Ödemeler.
export class CreateBillDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(RecurrencePeriodDto)
  recurrencePeriod?: RecurrencePeriodDto;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
