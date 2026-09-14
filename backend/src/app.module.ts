import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { BillsModule } from './modules/bills/bills.module.js';
import { SavingsModule } from './modules/savings/savings.module.js';
import { HouseholdModule } from './modules/household/household.module.js';
import { PremiumModule } from './modules/premium/premium.module.js';
import { PublicDebtModule } from './modules/public-debt/public-debt.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      load: [configuration],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty' },
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    AccountsModule,
    BillsModule,
    SavingsModule,
    HouseholdModule,
    PremiumModule,
    PublicDebtModule,
    NotificationsModule,
  ],
})
export class AppModule {}
