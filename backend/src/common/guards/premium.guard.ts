import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PREMIUM_KEY } from '../decorators/require-premium.decorator.js';

// AuthGuard('jwt') ile birlikte kullanılır; request.user JwtStrategy tarafından doldurulmuş olmalıdır.
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPremium = this.reflector.getAllAndOverride<boolean>(REQUIRE_PREMIUM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresPremium) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.tier !== 'PREMIUM') {
      throw new ForbiddenException('Bu özellik yalnızca Premium kullanıcılar içindir.');
    }

    return true;
  }
}
