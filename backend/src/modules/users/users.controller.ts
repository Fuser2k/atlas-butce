import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const dbUser = await this.usersService.findById(user.userId);
    return {
      id: dbUser?.id,
      email: dbUser?.email,
      fullName: dbUser?.fullName,
      tier: dbUser?.tier,
    };
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.userId, dto);
    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      tier: updated.tier,
    };
  }
}
