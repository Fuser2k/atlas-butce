import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionTypeDto } from './create-transaction.dto.js';

export class QueryTransactionDto {
  @IsOptional()
  @IsEnum(TransactionTypeDto)
  type?: TransactionTypeDto;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
