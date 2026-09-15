import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const accessToken = this.jwtService.sign({ sub: admin.id, email: admin.email, role: admin.role });
    return {
      accessToken,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    };
  }
}
