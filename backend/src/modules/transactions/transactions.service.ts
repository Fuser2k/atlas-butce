import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

// Madde 5.4 — Gelir ve Gider Yönetimi. Hafta 2 kapsamında doldurulacak (CRUD + filtreleme).
@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}
}
