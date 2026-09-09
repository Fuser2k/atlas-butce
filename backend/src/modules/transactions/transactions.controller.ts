import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { QueryTransactionDto } from './dto/query-transaction.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

// Madde 5.4 — Gelir/Gider CRUD + filtreleme; Madde 5.3 — özet (kısmi).
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryTransactionDto) {
    return this.transactionsService.findAll(user.userId, query);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryTransactionDto) {
    return this.transactionsService.summary(user.userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.transactionsService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.transactionsService.remove(user.userId, id);
  }
}
