import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndQuery(userId: string, query: string) {
    return this.prisma.searchHistory.findFirst({
      where: { user_id: userId, query },
    });
  }

  async create(userId: string, query: string) {
    return this.prisma.searchHistory.create({
      data: { user_id: userId, query },
    });
  }

  async updateTimestamp(id: string) {
    return this.prisma.searchHistory.update({
      where: { id },
      data: { searched_at: new Date() },
    });
  }

  async findRecentByUser(userId: string, limit = 20) {
    return this.prisma.searchHistory.findMany({
      where: { user_id: userId },
      orderBy: { searched_at: 'desc' },
      take: limit,
      distinct: ['query'],
    });
  }

  async deleteByUser(userId: string) {
    return this.prisma.searchHistory.deleteMany({
      where: { user_id: userId },
    });
  }

  async countByUser(userId: string) {
    return this.prisma.searchHistory.count({
      where: { user_id: userId },
    });
  }

  async deleteOldest(userId: string, keepCount: number) {
    const records = await this.prisma.searchHistory.findMany({
      where: { user_id: userId },
      orderBy: { searched_at: 'asc' },
      skip: keepCount,
    });
    if (records.length === 0) return;
    await this.prisma.searchHistory.deleteMany({
      where: { id: { in: records.map((r) => r.id) } },
    });
  }

  async upsertPopular(query: string) {
    return this.prisma.popularSearch.upsert({
      where: { query },
      create: { query, search_count: 1 },
      update: { search_count: { increment: 1 } },
    });
  }

  async findPopular(limit = 20) {
    return this.prisma.popularSearch.findMany({
      orderBy: [{ search_count: 'desc' }, { updated_at: 'desc' }],
      take: limit,
    });
  }

  async findPopularCategories(limit = 10) {
    return this.prisma.category.findMany({
      where: {
        video_categories: {
          some: {
            video: {
              visibility: 'PUBLIC' as any,
              status: 'ACTIVE' as any,
              deleted_at: null,
            },
          },
        },
      },
      include: {
        _count: {
          select: { video_categories: true },
        },
      },
      orderBy: {
        video_categories: { _count: 'desc' },
      },
      take: limit,
    });
  }

  async findTrendingTags(limit = 10) {
    return this.prisma.tag.findMany({
      where: {
        videos: {
          some: {
            video: {
              visibility: 'PUBLIC' as any,
              status: 'ACTIVE' as any,
              deleted_at: null,
            },
          },
        },
      },
      include: {
        _count: {
          select: { videos: true },
        },
      },
      orderBy: {
        videos: { _count: 'desc' },
      },
      take: limit,
    });
  }
}
