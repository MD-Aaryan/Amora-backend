import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApprovalStatus, VideoStatus, VideoVisibility } from '@prisma/client';
import { SearchCursor } from './interfaces';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly videoInclude = {
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

  private videoBaseWhere() {
    return {
      visibility: VideoVisibility.PUBLIC,
      status: VideoStatus.ACTIVE,
      deleted_at: null,
      OR: [
        { creator: { status: ApprovalStatus.APPROVED } },
        { salon: { status: ApprovalStatus.APPROVED } },
      ],
    };
  }

  private cursorWhere(cursor: SearchCursor) {
    return {
      OR: [
        { created_at: { lt: cursor.createdAt } },
        { created_at: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }

  async searchVideos(keyword: string, cursor?: SearchCursor, limit = 20) {
    const where: any = {
      ...this.videoBaseWhere(),
      AND: [
        {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { language: { contains: keyword, mode: 'insensitive' } },
            {
              creator: {
                user: {
                  display_name: { contains: keyword, mode: 'insensitive' },
                },
              },
            },
            {
              salon: { name: { contains: keyword, mode: 'insensitive' } },
            },
            {
              categories: {
                some: {
                  category: {
                    name: { contains: keyword, mode: 'insensitive' },
                  },
                },
              },
            },
            {
              tags: {
                some: {
                  tag: { name: { contains: keyword, mode: 'insensitive' } },
                },
              },
            },
          ],
        },
      ],
    };

    if (cursor) {
      where.AND.push(this.cursorWhere(cursor));
    }

    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        include: this.videoInclude,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      this.prisma.video.count({ where }),
    ]);

    return { items, total };
  }

  async searchCreators(keyword: string, cursor?: SearchCursor, limit = 20) {
    const where: any = {
      status: ApprovalStatus.APPROVED,
      deleted_at: null,
      OR: [
        { user: { display_name: { contains: keyword, mode: 'insensitive' } } },
        { user: { username: { contains: keyword, mode: 'insensitive' } } },
        { bio: { contains: keyword, mode: 'insensitive' } },
      ],
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

  async searchSalons(keyword: string, cursor?: SearchCursor, limit = 20) {
    const where: any = {
      status: ApprovalStatus.APPROVED,
      deleted_at: null,
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { address: { contains: keyword, mode: 'insensitive' } },
        { city: { contains: keyword, mode: 'insensitive' } },
        { state: { contains: keyword, mode: 'insensitive' } },
        { user: { display_name: { contains: keyword, mode: 'insensitive' } } },
      ],
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

  async searchCategories(keyword: string, cursor?: SearchCursor, limit = 20) {
    const where: any = {
      name: { contains: keyword, mode: 'insensitive' },
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
      this.prisma.category.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      this.prisma.category.count({ where }),
    ]);

    const enriched = await Promise.all(
      items.map(async (cat) => {
        const [videoCount, creatorCount, salonCount] = await Promise.all([
          this.prisma.videoCategory.count({
            where: {
              category_id: cat.id,
              video: {
                visibility: VideoVisibility.PUBLIC,
                status: VideoStatus.ACTIVE,
                deleted_at: null,
              },
            },
          }),
          this.prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(DISTINCT v.creator_id) as count
            FROM videos v
            JOIN video_categories vc ON vc.video_id = v.id
            WHERE vc.category_id = ${cat.id}
              AND v.visibility = ${VideoVisibility.PUBLIC}::video_visibility
              AND v.status = ${VideoStatus.ACTIVE}::video_status
              AND v.deleted_at IS NULL
              AND v.creator_id IS NOT NULL
          `,
          this.prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(DISTINCT v.salon_id) as count
            FROM videos v
            JOIN video_categories vc ON vc.video_id = v.id
            WHERE vc.category_id = ${cat.id}
              AND v.visibility = ${VideoVisibility.PUBLIC}::video_visibility
              AND v.status = ${VideoStatus.ACTIVE}::video_status
              AND v.deleted_at IS NULL
              AND v.salon_id IS NOT NULL
          `,
        ]);
        return {
          ...cat,
          videoCount,
          creatorCount: Number(creatorCount[0]?.count || 0),
          salonCount: Number(salonCount[0]?.count || 0),
        };
      }),
    );

    return { items: enriched, total };
  }

  async searchTags(keyword: string, cursor?: SearchCursor, limit = 20) {
    const where: any = {
      name: { contains: keyword, mode: 'insensitive' },
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
      this.prisma.tag.findMany({
        where,
        include: {
          _count: { select: { videos: true } },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      this.prisma.tag.count({ where }),
    ]);

    return { items, total };
  }

  async searchSuggestions(keyword: string) {
    const [videos, creators, salons, categories] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          ...this.videoBaseWhere(),
          title: { contains: keyword, mode: 'insensitive' },
        },
        select: { id: true, title: true, thumbnail_url: true },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      this.prisma.creatorProfile.findMany({
        where: {
          status: ApprovalStatus.APPROVED,
          deleted_at: null,
          OR: [
            {
              user: {
                display_name: { contains: keyword, mode: 'insensitive' },
              },
            },
            { user: { username: { contains: keyword, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          user: {
            select: { display_name: true, username: true, avatar_url: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      this.prisma.salonProfile.findMany({
        where: {
          status: ApprovalStatus.APPROVED,
          deleted_at: null,
          name: { contains: keyword, mode: 'insensitive' },
        },
        select: { id: true, name: true, logo_url: true },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      this.prisma.category.findMany({
        where: { name: { contains: keyword, mode: 'insensitive' } },
        select: { id: true, name: true },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
    ]);

    const items: Array<{
      type: 'video' | 'creator' | 'salon' | 'category';
      id: string;
      text: string;
      image: string | null;
    }> = [];

    for (const v of videos) {
      items.push({
        type: 'video',
        id: v.id,
        text: v.title,
        image: v.thumbnail_url,
      });
      if (items.length >= 10) break;
    }

    for (const c of creators) {
      if (items.length >= 10) break;
      items.push({
        type: 'creator',
        id: c.id,
        text: c.user?.display_name || c.user?.username || 'Unknown',
        image: c.user?.avatar_url || null,
      });
    }

    for (const s of salons) {
      if (items.length >= 10) break;
      items.push({ type: 'salon', id: s.id, text: s.name, image: s.logo_url });
    }

    for (const cat of categories) {
      if (items.length >= 10) break;
      items.push({ type: 'category', id: cat.id, text: cat.name, image: null });
    }

    return items.slice(0, 10);
  }

  async getCreatorFollowerCount(userId: string) {
    const count = await this.prisma.follower.count({
      where: { following_id: userId },
    });
    return count;
  }

  async getSalonAverageRating(salonId: string) {
    const result = await this.prisma.review.aggregate({
      where: { salon_id: salonId },
      _avg: { rating: true },
    });
    return result._avg.rating;
  }
}
