import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SavingsService } from './savings.service.js';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto.js';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto.js';
import { UpdateSavingGoalProgressDto } from './dto/update-saving-goal-progress.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

// Madde 5.9 — Birikim ve Finansal Hedef Yönetimi.
@Controller('savings')
@UseGuards(AuthGuard('jwt'))
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSavingGoalDto) {
    return this.savingsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.savingsService.findAll(user.userId);
  }

  // /savings/:id ile çakışmaması için sabit rota önce tanımlanır.
  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.savingsService.summary(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.savingsService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateSavingGoalDto) {
    return this.savingsService.update(user.userId, id, dto);
  }

  @Patch(':id/progress')
  updateProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSavingGoalProgressDto,
  ) {
    return this.savingsService.updateProgress(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.savingsService.remove(user.userId, id);
  }
}
