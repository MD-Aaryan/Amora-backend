import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  VideoStatus,
  VideoVisibility,
  ReportStatus,
  Prisma,
} from '@prisma/client';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class ModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    cursor?: string;
    limit: number;
    status?: VideoStatus;
    categoryId?: string;
    creatorName?: string;
    sort?: string;
  }) {
    const where: Prisma.VideoWhereInput = { deleted_at: null };
    const orderBy: Prisma.VideoOrderByWithRelationInput = {
      created_at: 'desc',
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.categoryId) {
      where.categories = {
        some: { category_id: params.categoryId },
      };
    }

    if (params.creatorName) {
      where.OR = [
        {
          creator: {
            user: {
              display_name: {
                contains: params.creatorName,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          salon: {
            name: { contains: params.creatorName, mode: 'insensitive' },
          },
        },
        { title: { contains: params.creatorName, mode: 'insensitive' } },
      ];
    }

    switch (params.sort) {
      case 'oldest':
        orderBy.created_at = 'asc';
        break;
      case 'views':
        orderBy.views_count = 'desc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    const findManyArgs: Prisma.VideoFindManyArgs = {
      where,
      orderBy,
      take: params.limit + 1,
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
        salon: {
          select: { id: true, name: true, logo_url: true },
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        reports: {
          where: {
            status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
          },
          select: { id: true },
        },
      },
    };

    if (params.cursor) {
      const decoded = PaginationUtil.decodeCursor(params.cursor);
      findManyArgs.cursor = { id: decoded };
      findManyArgs.skip = 1;
    }

    const videos = await this.prisma.video.findMany(findManyArgs);

    const hasMore = videos.length > params.limit;
    if (hasMore) videos.pop();

    const nextCursor = hasMore
      ? PaginationUtil.encodeCursor(videos[videos.length - 1].id)
      : null;

    return { videos, nextCursor, hasMore };
  }

  async findById(id: string) {
    return this.prisma.video.findUnique({
      where: { id },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                username: true,
                avatar_url: true,
                email: true,
              },
            },
          },
        },
        salon: {
          select: { id: true, name: true, logo_url: true },
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        reports: {
          where: {
            status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
          },
          include: {
            reporter: { select: { id: true, display_name: true } },
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: VideoStatus,
    visibility?: VideoVisibility,
  ) {
    const data: Prisma.VideoUpdateInput = { status };
    if (visibility !== undefined) {
      data.visibility = visibility;
    }
    return this.prisma.video.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        updated_at: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.video.update({
      where: { id },
      data: {
        status: VideoStatus.DELETED,
        deleted_at: new Date(),
      },
      select: {
        id: true,
        title: true,
        status: true,
        deleted_at: true,
      },
    });
  }
}
