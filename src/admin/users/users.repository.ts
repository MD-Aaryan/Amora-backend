import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserStatus, RoleName, Prisma } from '@prisma/client';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    cursor?: string;
    limit: number;
    status?: UserStatus;
    role?: RoleName;
    country?: string;
    language?: string;
    search?: string;
    sort?: string;
  }) {
    const where: Prisma.UserWhereInput = {};
    const orderBy: Prisma.UserOrderByWithRelationInput = { created_at: 'desc' };

    if (params.status) {
      where.status = params.status;
      if (params.status !== UserStatus.DELETED) {
        where.deleted_at = null;
      }
    } else {
      where.deleted_at = null;
    }

    if (params.country) {
      where.country = { contains: params.country, mode: 'insensitive' };
    }

    if (params.language) {
      where.preferred_language = params.language;
    }

    if (params.search) {
      where.OR = [
        { display_name: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.roles = {
        some: {
          role: { name: params.role },
        },
      };
    }

    switch (params.sort) {
      case 'oldest':
        orderBy.created_at = 'asc';
        break;
      case 'alphabetical':
        orderBy.display_name = 'asc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    const findManyArgs: Prisma.UserFindManyArgs = {
      where,
      orderBy,
      take: params.limit + 1,
      select: {
        id: true,
        email: true,
        display_name: true,
        username: true,
        avatar_url: true,
        country: true,
        state: true,
        city: true,
        preferred_language: true,
        status: true,
        is_active: true,
        created_at: true,
        deleted_at: true,
        roles: {
          include: {
            role: { select: { name: true } },
          },
        },
      },
    };

    if (params.cursor) {
      const decoded = PaginationUtil.decodeCursor(params.cursor);
      findManyArgs.cursor = { id: decoded };
      findManyArgs.skip = 1;
    }

    const users = await this.prisma.user.findMany(findManyArgs);

    const hasMore = users.length > params.limit;
    if (hasMore) users.pop();

    const nextCursor = hasMore
      ? PaginationUtil.encodeCursor(users[users.length - 1].id)
      : null;

    return { users, nextCursor, hasMore };
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: { select: { name: true } } },
        },
        creator_profile: {
          select: { id: true, status: true },
        },
        salon_profiles: {
          where: { deleted_at: null },
          select: { id: true, name: true, status: true },
        },
      },
    });
  }

  async updateStatus(userId: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        is_active: status === UserStatus.ACTIVE,
        deleted_at:
          status === UserStatus.DELETED
            ? new Date()
            : status === UserStatus.ACTIVE
              ? null
              : undefined,
      },
      select: {
        id: true,
        display_name: true,
        email: true,
        status: true,
        is_active: true,
        deleted_at: true,
      },
    });
  }

  async restore(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        display_name: true,
        email: true,
        status: true,
        is_active: true,
      },
    });
  }
}
