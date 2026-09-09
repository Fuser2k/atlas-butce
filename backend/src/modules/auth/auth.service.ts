import { ConflictException, Injectable, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Bu e-posta ile kayıtlı bir kullanıcı zaten var.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    return this.buildAuthResponse(user);
  }

  // Hafta 1 kapsamı: endpoint iskeleti. Gerçek refresh-token rotasyonu sonraki hafta uygulanacak.
  refresh(): never {
    throw new NotImplementedException('Refresh token akışı henüz uygulanmadı (Hafta 2 kapsamında).');
  }

  // Hafta 1 kapsamı: endpoint iskeleti.
  requestPasswordReset(): never {
    throw new NotImplementedException('Şifre yenileme akışı henüz uygulanmadı (Hafta 2 kapsamında).');
  }

  // Hafta 1 kapsamı: endpoint iskeleti.
  deleteAccount(): never {
    throw new NotImplementedException('Hesap silme akışı henüz uygulanmadı (Hafta 2 kapsamında).');
  }

  private buildAuthResponse(user: { id: string; email: string; fullName: string | null; tier: string }) {
    const payload = { sub: user.id, email: user.email, tier: user.tier };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tier: user.tier,
      },
    };
  }
}
