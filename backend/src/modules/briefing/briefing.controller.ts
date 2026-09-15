import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BriefingService } from './briefing.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

// Madde 5.3 — Yazılı günlük ATLAS brifingi.
@Controller('briefing')
@UseGuards(AuthGuard('jwt'))
export class BriefingController {
  constructor(private readonly briefingService: BriefingService) {}

  @Get('daily')
  daily(@CurrentUser() user: AuthenticatedUser) {
    return this.briefingService.dailyBriefing(user.userId);
  }
}
