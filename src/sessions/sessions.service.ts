import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HashUtil } from '../common/utils/hash.util';

@Injectable()
export class SessionsService {
  private readonly MAX_SESSIONS_PER_USER = 10;

  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: {
    userId: string;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    const hashedToken = HashUtil.hashRefreshToken(data.refreshToken);

    await this.enforceSessionLimit(data.userId);

    return this.prisma.session.create({
      data: {
        user_id: data.userId,
        refresh_token: hashedToken,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        expires_at: data.expiresAt,
      },
    });
  }

  async findValidSession(refreshToken: string) {
    const hashedToken = HashUtil.hashRefreshToken(refreshToken);

    return this.prisma.session.findFirst({
      where: {
        refresh_token: hashedToken,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            roles: {
              include: { role: true },
            },
          },
        },
      },
    });
  }

  async revokeSession(refreshToken: string) {
    const hashedToken = HashUtil.hashRefreshToken(refreshToken);

    return this.prisma.session.updateMany({
      where: {
        refresh_token: hashedToken,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  }

  async revokeAllUserSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  }

  async rotateRefreshToken(data: {
    oldRefreshToken: string;
    newRefreshToken: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    const oldHashed = HashUtil.hashRefreshToken(data.oldRefreshToken);
    const newHashed = HashUtil.hashRefreshToken(data.newRefreshToken);

    await this.enforceSessionLimit(data.userId);

    // Atomic: revoke old + create new in a transaction
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { refresh_token: oldHashed, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
      this.prisma.session.create({
        data: {
          user_id: data.userId,
          refresh_token: newHashed,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          expires_at: data.expiresAt,
        },
      }),
    ]);
  }

  private async enforceSessionLimit(userId: string): Promise<void> {
    const activeCount = await this.prisma.session.count({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });

    if (activeCount >= this.MAX_SESSIONS_PER_USER) {
      // Revoke the oldest active sessions
      const oldestSessions = await this.prisma.session.findMany({
        where: {
          user_id: userId,
          revoked_at: null,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'asc' },
        take: activeCount - this.MAX_SESSIONS_PER_USER + 1,
      });

      if (oldestSessions.length > 0) {
        await this.prisma.session.updateMany({
          where: {
            id: { in: oldestSessions.map((s) => s.id) },
          },
          data: { revoked_at: new Date() },
        });
      }
    }
  }
}
