import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto.js';

// Admin Panel V0.1 — sadece operasyonel kullanıcı görünürlüğü.
// ÖNEMLİ: passwordHash, resetToken, transactions ve diğer finansal veriler
// bilerek select edilmiyor; buradaki hiçbir sorgu bu alanları döndürmemelidir.
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  tier: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, deletedUsers, freeUsers, premiumUsers, newUsersLast7Days] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: { not: null } } }),
        this.prisma.user.count({ where: { tier: 'FREE', deletedAt: null } }),
        this.prisma.user.count({ where: { tier: 'PREMIUM', deletedAt: null } }),
        this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ]);

    return { totalUsers, activeUsers, deletedUsers, freeUsers, premiumUsers, newUsersLast7Days };
  }

  async listUsers(query: QueryAdminUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      tier: query.tier,
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { fullName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: SAFE_USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => ({ ...user, accountStatus: user.deletedAt ? 'deleted' : 'active' })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    return { ...user, accountStatus: user.deletedAt ? 'deleted' : 'active' };
  }
}
