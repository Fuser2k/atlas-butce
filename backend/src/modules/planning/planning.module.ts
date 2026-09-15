import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller.js';
import { PlanningService } from './planning.service.js';

// Madde 5.3 — Aylık ödeme planı (fatura + kredi/kart/KMH vadeleri, tek liste).
@Module({
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
