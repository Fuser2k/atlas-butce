import { IsBooleanString, IsDateString, IsOptional, IsString } from 'class-validator';

export class QueryBillDto {
  @IsOptional()
  @IsBooleanString()
  isPaid?: string;

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
