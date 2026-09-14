import { Module } from '@nestjs/common';
import { BillsController } from './bills.controller.js';
import { BillsService } from './bills.service.js';

// Madde 5.6 / 5.7 — Faturalar, sabit ödemeler ve hatırlatıcılar.
@Module({
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}
