import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

// Madde 5.7 — Ödeme Hatırlatıcıları.
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findAll(user.userId);
  }

  // /notifications/:id ile çakışmaması için sabit rota önce tanımlanır.
  @Get('upcoming')
  findUpcoming(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findUpcoming(user.userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.userId, id);
  }
}
