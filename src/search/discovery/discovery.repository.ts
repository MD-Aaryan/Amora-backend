import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ApprovalStatus, VideoStatus, VideoVisibility } from '@prisma/client';
import { SearchCursor } from '../interfaces';

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private cursorWhere(cursor: SearchCursor) {
    return {
      OR: [
        { created_at: { lt: cursor.createdAt } },
        { created_at: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }

  async findCategories(cursor?: SearchCursor, limit = 20) {
    const where: any = {};

    if (cursor) {
      where.AND = [
        {
          OR: [
            { created_at: { lt: cursor.createdAt } },
            { created_at: cursor.createdAt, id: { lt: cursor.id } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      this.prisma.category.count({ where }),
    ]);

    const enriched = await Promise.all(
      items.map(async (cat) => {
        const videoCount = await this.prisma.videoCategory.count({
          where: {
            category_id: cat.id,
            video: {
              visibility: VideoVisibility.PUBLIC,
              status: VideoStatus.ACTIVE,
              deleted_at: null,
            },
          },
        });
        return { ...cat, videoCount };
      }),
    );

    return { items: enriched, total };
  }

  async findCreators(cursor?: SearchCursor, limit = 20) {
    const where: any = {
      status: ApprovalStatus.APPROVED,
      deleted_at: null,
    };

    if (cursor) {
      where.AND = [
        {
          OR: [
            { created_at: { lt: cursor.createdAt } },
            { created_at: cursor.createdAt, id: { lt: cursor.id } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.creatorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              username: true,
              avatar_url: true,
            },
          },
          _count: { select: { videos: true } },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      this.prisma.creatorProfile.count({ where }),
    ]);

    return { items, total };
  }

  async findSalons(cursor?: SearchCursor, limit = 20) {
    const where: any = {
      status: ApprovalStatus.APPROVED,
      deleted_at: null,
    };

    if (cursor) {
      where.AND = [
        {
          OR: [
            { created_at: { lt: cursor.createdAt } },
            { created_at: cursor.createdAt, id: { lt: cursor.id } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.salonProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, display_name: true, avatar_url: true },
          },
          _count: { select: { videos: true } },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      this.prisma.salonProfile.count({ where }),
    ]);

    return { items, total };
  }

  async findFilteredVideos(params: {
    keyword?: string;
    categoryId?: string;
    language?: string;
    creatorId?: string;
    salonId?: string;
    sort?: string;
    cursor?: SearchCursor;
    limit?: number;
  }) {
    const {
      keyword,
      categoryId,
      language,
      creatorId,
      salonId,
      sort,
      cursor,
      limit = 20,
    } = params;

    const where: any = {
      visibility: VideoVisibility.PUBLIC,
      status: VideoStatus.ACTIVE,
      deleted_at: null,
      OR: [
        { creator: { status: ApprovalStatus.APPROVED } },
        { salon: { status: ApprovalStatus.APPROVED } },
      ],
    };

    const filters: any[] = [];

    if (keyword) {
      filters.push({
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      });
    }
    if (categoryId) {
      filters.push({
        categories: { some: { category_id: categoryId } },
      });
    }
    if (language) {
      filters.push({ language });
    }
    if (creatorId) {
      filters.push({ creator_id: creatorId });
    }
    if (salonId) {
      filters.push({ salon_id: salonId });
    }
    if (cursor) {
      filters.push({
        OR: [
          { created_at: { lt: cursor.createdAt } },
          { created_at: cursor.createdAt, id: { lt: cursor.id } },
        ],
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    let orderBy: any = [{ created_at: 'desc' }, { id: 'desc' }];
    if (sort === 'oldest') {
      orderBy = [{ created_at: 'asc' }, { id: 'asc' }];
    } else if (sort === 'most_viewed') {
      orderBy = [{ views_count: 'desc' }, { created_at: 'desc' }];
    }

    const videoInclude = {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      creator: {
        include: {
          user: { select: { display_name: true, avatar_url: true } },
        },
      },
      salon: {
        include: {
          user: { select: { display_name: true, avatar_url: true } },
        },
      },
    } as const;

    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        include: videoInclude,
        orderBy,
        take: limit + 1,
      }),
      this.prisma.video.count({ where }),
    ]);

    return { items, total };
  }

  async getCreatorFollowerCount(userId: string) {
    return this.prisma.follower.count({
      where: { following_id: userId },
    });
  }

  async getSalonAverageRating(salonId: string) {
    const result = await this.prisma.review.aggregate({
      where: { salon_id: salonId },
      _avg: { rating: true },
    });
    return result._avg.rating;
  }
}
