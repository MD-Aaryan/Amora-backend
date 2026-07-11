import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, ReportStatus } from '@prisma/client';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class AdminReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    cursor?: string;
    limit: number;
    status?: ReportStatus;
    reason?: string;
    sort?: string;
  }) {
    const where: Prisma.ReportWhereInput = {};
    const orderBy: Prisma.ReportOrderByWithRelationInput = {
      created_at: 'desc',
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.reason) {
      where.reason = { contains: params.reason, mode: 'insensitive' };
    }

    switch (params.sort) {
      case 'oldest':
        orderBy.created_at = 'asc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    const findManyArgs: Prisma.ReportFindManyArgs = {
      where,
      orderBy,
      take: params.limit + 1,
      include: {
        reporter: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
          },
        },
        reported_user: {
          select: { id: true, display_name: true, username: true },
        },
        reported_video: {
          select: { id: true, title: true, thumbnail_url: true },
        },
        reported_comment: { select: { id: true, content: true } },
        resolver: { select: { id: true, display_name: true } },
      },
    };

    if (params.cursor) {
      const decoded = PaginationUtil.decodeCursor(params.cursor);
      findManyArgs.cursor = { id: decoded };
      findManyArgs.skip = 1;
    }

    const reports = await this.prisma.report.findMany(findManyArgs);

    const hasMore = reports.length > params.limit;
    if (hasMore) reports.pop();

    const nextCursor = hasMore
      ? PaginationUtil.encodeCursor(reports[reports.length - 1].id)
      : null;

    return { reports, nextCursor, hasMore };
  }

  async findById(id: string) {
    return this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
            email: true,
          },
        },
        reported_user: {
          select: { id: true, display_name: true, username: true, email: true },
        },
        reported_video: {
          select: {
            id: true,
            title: true,
            thumbnail_url: true,
            video_url: true,
            status: true,
            creator: {
              include: {
                user: {
                  select: { id: true, display_name: true, username: true },
                },
              },
            },
          },
        },
        reported_comment: {
          select: {
            id: true,
            content: true,
            user: { select: { id: true, display_name: true, username: true } },
          },
        },
        resolver: { select: { id: true, display_name: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    resolvedBy: string,
    resolution?: string,
  ) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status,
        resolved_by: resolvedBy,
        resolution: resolution || null,
      },
      select: {
        id: true,
        status: true,
        resolution: true,
        resolved_by: true,
        updated_at: true,
      },
    });
  }
}
