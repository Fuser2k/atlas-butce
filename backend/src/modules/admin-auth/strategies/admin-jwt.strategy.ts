import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
}

// Ayrı strateji adı ('admin-jwt') + ayrı secret (ADMIN_JWT_SECRET) sayesinde
// mobil kullanıcı token'ları bu stratejiyle asla doğrulanamaz.
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('adminJwt.secret'),
    });
  }

  validate(payload: AdminJwtPayload) {
    return { adminUserId: payload.sub, email: payload.email, role: payload.role };
  }
}
