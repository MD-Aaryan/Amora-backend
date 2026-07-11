import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import { SearchCursor } from './interfaces';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly defaultLimit = 20;

  constructor(private readonly searchRepository: SearchRepository) {}

  async globalSearch(keyword: string, cursor?: string, limit?: number) {
    this.validateKeyword(keyword);
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);

    const [videos, creators, salons, categories] = await Promise.all([
      this.searchRepository.searchVideos(keyword, parsedCursor, effectiveLimit),
      this.searchRepository.searchCreators(
        keyword,
        parsedCursor,
        effectiveLimit,
      ),
      this.searchRepository.searchSalons(keyword, parsedCursor, effectiveLimit),
      this.searchRepository.searchCategories(
        keyword,
        parsedCursor,
        effectiveLimit,
      ),
    ]);

    return {
      videos: this.buildSectionResponse(videos, effectiveLimit, 'videos'),
      creators: this.buildSectionResponse(creators, effectiveLimit, 'creators'),
      salons: this.buildSectionResponse(salons, effectiveLimit, 'salons'),
      categories: this.buildSectionResponse(
        categories,
        effectiveLimit,
        'categories',
      ),
    };
  }

  async searchVideos(keyword: string, cursor?: string, limit?: number) {
    this.validateKeyword(keyword);
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.searchRepository.searchVideos(
      keyword,
      parsedCursor,
      effectiveLimit,
    );
    return this.buildSectionResponse(result, effectiveLimit, 'videos');
  }

  async searchCreators(keyword: string, cursor?: string, limit?: number) {
    this.validateKeyword(keyword);
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.searchRepository.searchCreators(
      keyword,
      parsedCursor,
      effectiveLimit,
    );
    const items = await Promise.all(
      (result.items as any[]).map(async (creator) => {
        const followerCount =
          await this.searchRepository.getCreatorFollowerCount(creator.user_id);
        return {
          id: creator.id,
          displayName: creator.user?.display_name || null,
          username: creator.user?.username || null,
          avatarUrl: creator.user?.avatar_url || null,
          bio: creator.bio || null,
          isVerified: creator.is_verified,
          followerCount,
          videoCount: creator._count?.videos || 0,
          createdAt: creator.created_at,
        };
      }),
    );
    return this.buildPaginatedResponse(items, result.total, effectiveLimit);
  }

  async searchSalons(keyword: string, cursor?: string, limit?: number) {
    this.validateKeyword(keyword);
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.searchRepository.searchSalons(
      keyword,
      parsedCursor,
      effectiveLimit,
    );
    const items = await Promise.all(
      (result.items as any[]).map(async (salon) => {
        const avgRating = await this.searchRepository.getSalonAverageRating(
          salon.id,
        );
        return {
          id: salon.id,
          name: salon.name,
          logo: salon.logo_url || null,
          description: salon.description || null,
          address: salon.address,
          city: salon.city,
          state: salon.state,
          isVerified: salon.is_verified,
          rating: avgRating ? Number(avgRating.toFixed(1)) : null,
          createdAt: salon.created_at,
        };
      }),
    );
    return this.buildPaginatedResponse(items, result.total, effectiveLimit);
  }

  async searchCategories(keyword: string, cursor?: string, limit?: number) {
    this.validateKeyword(keyword);
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.searchRepository.searchCategories(
      keyword,
      parsedCursor,
      effectiveLimit,
    );
    const items = (result.items as any[]).map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || null,
      videoCount: cat.videoCount,
      creatorCount: cat.creatorCount,
      salonCount: cat.salonCount,
      createdAt: cat.created_at,
    }));
    return this.buildPaginatedResponse(items, result.total, effectiveLimit);
  }

  async searchTags(keyword: string, cursor?: string, limit?: number) {
    this.validateKeyword(keyword);
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.searchRepository.searchTags(
      keyword,
      parsedCursor,
      effectiveLimit,
    );
    const items = (result.items as any[]).map((tag) => ({
      id: tag.id,
      name: tag.name,
      videoCount: tag._count?.videos || 0,
      createdAt: tag.created_at,
    }));
    return this.buildPaginatedResponse(items, result.total, effectiveLimit);
  }

  async getSuggestions(keyword: string) {
    this.validateKeyword(keyword);
    const items = await this.searchRepository.searchSuggestions(keyword);
    return { items };
  }

  private buildSectionResponse(
    result: { items: any[]; total: number },
    limit: number,
    type: string,
  ) {
    const hasMore = result.items.length > limit;
    const sliced = hasMore ? result.items.slice(0, limit) : result.items;

    let items: any[];

    if (type === 'videos') {
      items = sliced.map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description || null,
        thumbnailUrl: v.thumbnail_url,
        duration: v.duration,
        language: v.language,
        viewsCount: v.views_count,
        createdAt: v.created_at,
        categories: (v.categories || []).map((vc: any) => ({
          id: vc.category.id,
          name: vc.category.name,
        })),
        creator: v.creator
          ? {
              id: v.creator.id,
              name: v.creator.user?.display_name || null,
              avatar: v.creator.user?.avatar_url || null,
            }
          : null,
        salon: v.salon
          ? {
              id: v.salon.id,
              name: v.salon.name,
              logo: v.salon.logo_url || null,
            }
          : null,
      }));
    } else if (type === 'categories') {
      items = sliced.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        videoCount: c.videoCount,
        creatorCount: c.creatorCount,
        salonCount: c.salonCount,
      }));
    } else {
      items = sliced;
    }

    let nextCursor: string | null = null;
    if (hasMore && sliced.length > 0) {
      const last = sliced[sliced.length - 1];
      nextCursor = this.encodeCursor(last.created_at, last.id);
    }

    return {
      items,
      nextCursor,
      hasMore,
      total: result.total,
    };
  }

  private buildPaginatedResponse(items: any[], total: number, limit: number) {
    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;

    let nextCursor: string | null = null;
    if (hasMore && sliced.length > 0) {
      const last = sliced[sliced.length - 1];
      nextCursor = this.encodeCursor(last.createdAt || new Date(), last.id);
    }

    return {
      items: sliced,
      nextCursor,
      hasMore,
      total,
    };
  }

  private encodeCursor(createdAt: Date, id: string): string {
    const payload = `${createdAt.toISOString()}_${id}`;
    return Buffer.from(payload)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private parseCursor(cursor?: string): SearchCursor | undefined {
    if (!cursor) return undefined;
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('ascii');
      const separatorIndex = decoded.lastIndexOf('_');
      if (separatorIndex === -1) throw new Error('Invalid cursor format');
      const createdAtStr = decoded.substring(0, separatorIndex);
      const id = decoded.substring(separatorIndex + 1);
      const createdAt = new Date(createdAtStr);
      if (isNaN(createdAt.getTime())) throw new Error('Invalid date in cursor');
      return { createdAt, id };
    } catch {
      throw new BadRequestException({
        success: false,
        message: 'Invalid cursor format.',
        error: { code: 'INVALID_CURSOR' },
      });
    }
  }

  private validateKeyword(keyword: string) {
    if (!keyword || keyword.trim().length < 2) {
      throw new BadRequestException({
        success: false,
        message: 'Keyword must be at least 2 characters long.',
        error: { code: 'INVALID_KEYWORD' },
      });
    }
  }
}
