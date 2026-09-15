import { Module } from '@nestjs/common';
import { HouseholdController } from './household.controller.js';
import { HouseholdService } from './household.service.js';

// Madde 5.8 — Hane halkı yönetimi.
@Module({
  controllers: [HouseholdController],
  providers: [HouseholdService],
  exports: [HouseholdService],
})
export class HouseholdModule {}
