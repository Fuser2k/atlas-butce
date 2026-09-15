import { Module } from '@nestjs/common';
import { BriefingController } from './briefing.controller.js';
import { BriefingService } from './briefing.service.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { PlanningModule } from '../planning/planning.module.js';

// Madde 5.3 — Yazılı günlük ATLAS brifingi (rule-based, AI kullanmaz).
@Module({
  imports: [AccountsModule, TransactionsModule, PlanningModule],
  controllers: [BriefingController],
  providers: [BriefingService],
})
export class BriefingModule {}
