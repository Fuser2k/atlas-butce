import { Module } from '@nestjs/common';
import { SavingsController } from './savings.controller.js';
import { SavingsService } from './savings.service.js';

// Madde 5.9 — Birikim ve finansal hedef yönetimi.
@Module({
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
