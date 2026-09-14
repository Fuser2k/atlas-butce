import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillsService } from './bills.service.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import { UpdateBillDto } from './dto/update-bill.dto.js';
import { QueryBillDto } from './dto/query-bill.dto.js';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tier: string;
}

// Madde 5.6 / 5.7 — Faturalar, Sabit Ödemeler ve Ödeme Hatırlatıcıları.
@Controller('bills')
@UseGuards(AuthGuard('jwt'))
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBillDto) {
    return this.billsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryBillDto) {
    return this.billsService.findAll(user.userId, query);
  }

  // /bills/:id ile çakışmaması için sabit rota önce tanımlanır.
  @Get('upcoming')
  findUpcoming(@CurrentUser() user: AuthenticatedUser, @Query('days') days?: string) {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.billsService.findUpcoming(user.userId, Number.isFinite(parsedDays) ? parsedDays : 30);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.billsService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateBillDto) {
    return this.billsService.update(user.userId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBillStatusDto,
  ) {
    return this.billsService.updateStatus(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.billsService.remove(user.userId, id);
  }
}
