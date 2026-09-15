import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HouseholdService } from './household.service.js';
import { CreateHouseholdMemberDto } from './dto/create-household-member.dto.js';
import { UpdateHouseholdMemberDto } from './dto/update-household-member.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

// Madde 5.8 — Hane Halkı Yönetimi.
@Controller('household')
@UseGuards(AuthGuard('jwt'))
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHouseholdMemberDto) {
    return this.householdService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.householdService.findAll(user.userId);
  }

  // /household/:id ile çakışmaması için sabit rota önce tanımlanır.
  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.householdService.summary(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.householdService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateHouseholdMemberDto,
  ) {
    return this.householdService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.householdService.remove(user.userId, id);
  }
}
