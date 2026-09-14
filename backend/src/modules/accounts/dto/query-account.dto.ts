import { IsEnum, IsOptional } from 'class-validator';
import { AccountTypeDto } from './create-account.dto.js';

export class QueryAccountDto {
  @IsOptional()
  @IsEnum(AccountTypeDto)
  type?: AccountTypeDto;
}
