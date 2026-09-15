import { IsNumber } from 'class-validator';

// Pozitif değer birikime ekler, negatif değer azaltır (0'ın altına düşürülemez).
export class UpdateSavingGoalProgressDto {
  @IsNumber()
  delta: number;
}
