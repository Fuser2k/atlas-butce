import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto.js';

const BCRYPT_SALT_ROUNDS = 10;
const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

type AuthUser = { id: string; email: string; fullName: string | null; tier: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token geçersiz veya süresi dolmuş.');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    return this.buildAuthResponse(user);
  }

  // Not: E-posta gönderimi Madde 22 kapsamında proje bedeline dahil değil ve henüz entegre edilmedi.
  // Bu nedenle reset token'ı, gerçek e-posta entegrasyonu tamamlanana kadar dev/test yanıtında döndürülür.
  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // E-posta enumeration riskini önlemek için kullanıcı bulunamasa da aynı cevap dönülür.
      return { message: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.' };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await this.usersService.setPasswordResetToken(user.id, tokenHash, expiresAt);

    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    return {
      message: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.',
      ...(isProd ? {} : { devResetToken: rawToken }),
    };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.usersService.findByValidResetToken(tokenHash);
    if (!user) {
      throw new UnauthorizedException('Sıfırlama bağlantısı geçersiz veya süresi dolmuş.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.updatePassword(user.id, passwordHash);

    return { message: 'Şifreniz güncellendi.' };
  }

  async deleteAccount(userId: string) {
    await this.usersService.softDelete(userId);
    return { message: 'Hesabınız silindi.' };
  }

  private buildAuthResponse(user: AuthUser) {
    const payload = { sub: user.id, email: user.email, tier: user.tier };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.refreshExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tier: user.tier,
      },
    };
  }
}
