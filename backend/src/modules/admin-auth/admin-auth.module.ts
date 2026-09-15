import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy.js';

// Mobil AuthModule'den bilinçli olarak bağımsız: kendi JwtModule örneğini
// (ADMIN_JWT_SECRET ile) kurar, mobil AuthModule'ün JwtService'ini paylaşmaz.
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('adminJwt.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('adminJwt.expiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
