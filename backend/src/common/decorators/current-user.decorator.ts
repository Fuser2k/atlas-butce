import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Kullanıcı verisi izolasyonu: controller'lar userId'yi buradan alır, body/query'den asla güvenmez.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
