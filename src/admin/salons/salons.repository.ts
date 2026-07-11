import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ApprovalStatus, KycStatus, Prisma } from '@prisma/client';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class AdminSalonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    cursor?: string;
    limit: number;
    status?: ApprovalStatus;
    search?: string;
    sort?: string;
  }) {
    const where: Prisma.SalonProfileWhereInput = { deleted_at: null };
    const orderBy: Prisma.SalonProfileOrderByWithRelationInput = {
      created_at: 'desc',
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        {
          user: {
            display_name: { contains: params.search, mode: 'insensitive' },
          },
        },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    switch (params.sort) {
      case 'oldest':
        orderBy.created_at = 'asc';
        break;
      case 'alphabetical':
        orderBy.name = 'asc';
        break;
      case 'status':
        orderBy.status = 'asc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    const findManyArgs: Prisma.SalonProfileFindManyArgs = {
      where,
      orderBy,
      take: params.limit + 1,
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            email: true,
            avatar_url: true,
            status: true,
            is_active: true,
            created_at: true,
          },
        },
        kyc: {
          select: {
            id: true,
            status: true,
            submitted_at: true,
            reviewed_at: true,
          },
        },
      },
    };

    if (params.cursor) {
      const decoded = PaginationUtil.decodeCursor(params.cursor);
      findManyArgs.cursor = { id: decoded };
      findManyArgs.skip = 1;
    }

    const profiles = await this.prisma.salonProfile.findMany(findManyArgs);

    const hasMore = profiles.length > params.limit;
    if (hasMore) profiles.pop();

    const nextCursor = hasMore
      ? PaginationUtil.encodeCursor(profiles[profiles.length - 1].id)
      : null;

    return { profiles, nextCursor, hasMore };
  }

  async findById(id: string) {
    return this.prisma.salonProfile.findUnique({
      where: { id },
      include: {
        kyc: true,
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            email: true,
            avatar_url: true,
            country: true,
            state: true,
            city: true,
            preferred_language: true,
            status: true,
            is_active: true,
            created_at: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: ApprovalStatus,
    rejectedReason?: string,
  ) {
    return this.prisma.salonProfile.update({
      where: { id },
      data: {
        status,
        rejected_reason: rejectedReason || null,
        is_verified: status === ApprovalStatus.APPROVED,
      },
    });
  }

  async updateKycStatus(
    profileId: string,
    status: KycStatus,
    reviewedBy: string,
    rejectionReason?: string,
  ) {
    return this.prisma.salonKyc.update({
      where: { salon_profile_id: profileId },
      data: {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_reason: rejectionReason || null,
      },
    });
  }
}
