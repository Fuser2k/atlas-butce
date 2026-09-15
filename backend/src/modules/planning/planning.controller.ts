import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlanningService } from './planning.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

// Madde 5.3 — Dashboard V3: aylık ödeme planı.
@Controller('planning')
@UseGuards(AuthGuard('jwt'))
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('monthly')
  monthly(@CurrentUser() user: AuthenticatedUser) {
    return this.planningService.monthlyPaymentPlan(user.userId);
  }
}
