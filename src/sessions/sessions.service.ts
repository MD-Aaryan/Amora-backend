import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HashUtil } from '../common/utils/hash.util';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new session record storing the hashed refresh token.
   */
  async createSession(data: {
    userId: string;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    const hashedToken = HashUtil.hashRefreshToken(data.refreshToken);

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

  /**
   * Find a valid (non-revoked, non-expired) session by its hashed refresh token.
   */
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

  /**
   * Revoke a specific session (logout from a single device).
   */
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

  /**
   * Revoke all active sessions for a user (force logout everywhere).
   */
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

  /**
   * Rotate a refresh token: revoke the old one and create a new session.
   */
  async rotateRefreshToken(data: {
    oldRefreshToken: string;
    newRefreshToken: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    // Revoke old session
    await this.revokeSession(data.oldRefreshToken);

    // Create new session with the new token
    return this.createSession({
      userId: data.userId,
      refreshToken: data.newRefreshToken,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
    });
  }
}
