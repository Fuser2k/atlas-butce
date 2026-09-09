import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Kullanıcı verisi izolasyonu: silinmiş (soft-deleted) hesaplar hiçbir sorguya dahil edilmez.
  findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: { email: string; passwordHash: string; fullName?: string }) {
    return this.prisma.user.create({ data });
  }

  updateProfile(userId: string, data: { fullName?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  softDelete(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
    });
  }

  async findByValidResetToken(tokenHash: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null },
    });
  }
}
