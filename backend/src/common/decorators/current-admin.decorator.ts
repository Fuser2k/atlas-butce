import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Admin JWT stratejisinin (request.adminUser) doldurduğu veriyi okur.
// Mobil kullanıcı context'i (@CurrentUser) ile karıştırılmamalı.
export const CurrentAdmin = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.adminUser;
});
