import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, Min, MaxLength } from 'class-validator';

// Madde 5.9 — Birikim ve Finansal Hedef Yönetimi.
export class CreateSavingGoalDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsNumber()
  @IsPositive()
  targetAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPlanAmount?: number;
}
