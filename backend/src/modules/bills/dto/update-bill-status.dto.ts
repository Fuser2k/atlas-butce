import { IsBoolean } from 'class-validator';

export class UpdateBillStatusDto {
  @IsBoolean()
  isPaid: boolean;
}
