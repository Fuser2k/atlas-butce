import { PartialType } from '@nestjs/mapped-types';
import { CreateSavingGoalDto } from './create-saving-goal.dto.js';

export class UpdateSavingGoalDto extends PartialType(CreateSavingGoalDto) {}
