import { IsString, MaxLength } from 'class-validator';

// Madde 5.8 — Hane Halkı Yönetimi.
export class CreateHouseholdMemberDto {
  @IsString()
  @MaxLength(80)
  name: string;
}
