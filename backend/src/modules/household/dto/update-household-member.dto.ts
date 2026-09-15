import { PartialType } from '@nestjs/mapped-types';
import { CreateHouseholdMemberDto } from './create-household-member.dto.js';

export class UpdateHouseholdMemberDto extends PartialType(CreateHouseholdMemberDto) {}
