import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service.js';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto.js';

// Tüm /admin/* endpoint'leri (auth/login hariç) admin-jwt stratejisiyle korunur.
// Mobil kullanıcı JWT'si (farklı secret ile imzalanmış) burada asla doğrulanamaz.
@Controller('admin')
@UseGuards(AuthGuard('admin-jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('users')
  listUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }
}
