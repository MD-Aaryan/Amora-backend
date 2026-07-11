import { Injectable, BadRequestException } from '@nestjs/common';
import { DiscoveryRepository } from './discovery.repository';
import { SearchCursor } from '../interfaces';

@Injectable()
export class DiscoveryService {
  private readonly defaultLimit = 20;

  constructor(private readonly discoveryRepository: DiscoveryRepository) {}

  async discoverCategories(cursor?: string, limit?: number) {
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.discoveryRepository.findCategories(
      parsedCursor,
      effectiveLimit,
    );
    return this.buildResponse(result, effectiveLimit, (cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || null,
      videoCount: cat.videoCount,
    }));
  }

  async discoverCreators(cursor?: string, limit?: number) {
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.discoveryRepository.findCreators(
      parsedCursor,
      effectiveLimit,
    );
    return this.buildResponse(result, effectiveLimit, async (creator: any) => {
      const followerCount =
        await this.discoveryRepository.getCreatorFollowerCount(creator.user_id);
      return {
        id: creator.id,
        displayName: creator.user?.display_name || null,
        username: creator.user?.username || null,
        avatarUrl: creator.user?.avatar_url || null,
        bio: creator.bio || null,
        isVerified: creator.is_verified,
        followerCount,
        videoCount: creator._count?.videos || 0,
      };
    });
  }

  async discoverSalons(cursor?: string, limit?: number) {
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.discoveryRepository.findSalons(
      parsedCursor,
      effectiveLimit,
    );
    return this.buildResponse(result, effectiveLimit, async (salon: any) => {
      const avgRating = await this.discoveryRepository.getSalonAverageRating(
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
      };
    });
  }

  async discoverPopular(cursor?: string, limit?: number) {
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const result = await this.discoveryRepository.findCategories(
      parsedCursor,
      effectiveLimit,
    );
    return this.buildResponse(result, effectiveLimit, (cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || null,
      videoCount: cat.videoCount,
    }));
  }

  async filterVideos(params: {
    keyword?: string;
    categoryId?: string;
    language?: string;
    creatorId?: string;
    salonId?: string;
    sort?: string;
    cursor?: string;
    limit?: number;
  }) {
    const effectiveLimit = params.limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(params.cursor);
    const result = await this.discoveryRepository.findFilteredVideos({
      ...params,
      cursor: parsedCursor,
      limit: effectiveLimit,
    });

    const hasMore = result.items.length > effectiveLimit;
    const sliced = hasMore
      ? result.items.slice(0, effectiveLimit)
      : result.items;

    const items = sliced.map((v: any) => ({
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
        ? { id: v.salon.id, name: v.salon.name, logo: v.salon.logo_url || null }
        : null,
    }));

    let nextCursor: string | null = null;
    if (hasMore && sliced.length > 0) {
      const last = sliced[sliced.length - 1];
      nextCursor = this.encodeCursor(last.created_at, last.id);
    }

    return { items, nextCursor, hasMore, total: result.total };
  }

  private async buildResponse(
    result: { items: any[]; total: number },
    limit: number,
    mapper: Function,
  ) {
    const hasMore = result.items.length > limit;
    const sliced = hasMore ? result.items.slice(0, limit) : result.items;
    const items = await Promise.all(sliced.map((item: any) => mapper(item)));

    let nextCursor: string | null = null;
    if (hasMore && sliced.length > 0) {
      const last = sliced[sliced.length - 1];
      nextCursor = this.encodeCursor(last.created_at, last.id);
    }

    return { items, nextCursor, hasMore, total: result.total };
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
}
