import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FeedRepository } from './feed.repository';
import { CreatorRepository } from '../creator/creator.repository';
import { SalonRepository } from '../salon/salon.repository';
import { VideoRepository } from '../video/video.repository';
import { FeedItem, FeedResponse } from './entities/feed-item.entity';
import { FeedCursor } from './interfaces';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class FeedService {
  private readonly defaultLimit = 20;

  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly creatorRepository: CreatorRepository,
    private readonly salonRepository: SalonRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async getHomeFeed(cursor?: string, limit?: number): Promise<FeedResponse> {
    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const videos = await this.feedRepository.findFeed(
      parsedCursor,
      effectiveLimit,
    );
    return this.buildFeedResponse(videos, effectiveLimit);
  }

  async getLatestFeed(cursor?: string, limit?: number): Promise<FeedResponse> {
    return this.getHomeFeed(cursor, limit);
  }

  async getCategoryFeed(
    categoryId: string,
    cursor?: string,
    limit?: number,
  ): Promise<FeedResponse> {
    const exists = await this.videoRepository.categoryExists(categoryId);
    if (!exists) {
      throw new NotFoundException({
        success: false,
        message: 'Category not found.',
        error: { code: 'CATEGORY_NOT_FOUND' },
      });
    }

    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const videos = await this.feedRepository.findByCategory(
      categoryId,
      parsedCursor,
      effectiveLimit,
    );
    return this.buildFeedResponse(videos, effectiveLimit);
  }

  async getCreatorFeed(creatorId: string, cursor?: string, limit?: number) {
    const creator = await this.creatorRepository.findById(creatorId);
    if (!creator || creator.deleted_at) {
      throw new NotFoundException({
        success: false,
        message: 'Creator not found.',
        error: { code: 'CREATOR_NOT_FOUND' },
      });
    }

    if (creator.status !== ApprovalStatus.APPROVED) {
      throw new NotFoundException({
        success: false,
        message: 'Creator not found.',
        error: { code: 'CREATOR_NOT_FOUND' },
      });
    }

    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const videos = await this.feedRepository.findByCreator(
      creatorId,
      parsedCursor,
      effectiveLimit,
    );
    const feed = this.buildFeedResponse(videos, effectiveLimit);

    return {
      creator: {
        id: creator.id,
        name: creator.user?.display_name || null,
        avatar: creator.user?.avatar_url || null,
        bio: creator.bio || null,
      },
      items: feed.items,
      nextCursor: feed.nextCursor,
      hasMore: feed.hasMore,
    };
  }

  async getSalonFeed(salonId: string, cursor?: string, limit?: number) {
    const salon = await this.salonRepository.findById(salonId);
    if (!salon || salon.deleted_at) {
      throw new NotFoundException({
        success: false,
        message: 'Salon not found.',
        error: { code: 'SALON_NOT_FOUND' },
      });
    }

    if (salon.status !== ApprovalStatus.APPROVED) {
      throw new NotFoundException({
        success: false,
        message: 'Salon not found.',
        error: { code: 'SALON_NOT_FOUND' },
      });
    }

    const effectiveLimit = limit ?? this.defaultLimit;
    const parsedCursor = this.parseCursor(cursor);
    const videos = await this.feedRepository.findBySalon(
      salonId,
      parsedCursor,
      effectiveLimit,
    );
    const feed = this.buildFeedResponse(videos, effectiveLimit);

    return {
      salon: {
        id: salon.id,
        name: salon.name,
        logo: salon.logo_url || null,
        city: salon.city,
        state: salon.state,
      },
      items: feed.items,
      nextCursor: feed.nextCursor,
      hasMore: feed.hasMore,
    };
  }

  private buildFeedResponse(videos: any[], limit: number): FeedResponse {
    const hasMore = videos.length > limit;
    const items = hasMore ? videos.slice(0, limit) : videos;

    const feedItems = items.map((v: any) => this.mapToFeedItem(v));

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = this.encodeCursor(lastItem.created_at, lastItem.id);
    }

    return { items: feedItems, nextCursor, hasMore };
  }

  private mapToFeedItem(video: any): FeedItem {
    return {
      id: video.id,
      title: video.title,
      description: video.description || null,
      thumbnailUrl: video.thumbnail_url,
      duration: video.duration,
      language: video.language,
      visibility: video.visibility,
      viewsCount: video.views_count,
      createdAt: video.created_at,
      categories: (video.categories || []).map((vc: any) => ({
        id: vc.category.id,
        name: vc.category.name,
      })),
      tags: (video.tags || []).map((vt: any) => vt.tag.name),
      creator: video.creator
        ? {
            id: video.creator.id,
            name: video.creator.user?.display_name || null,
            avatar: video.creator.user?.avatar_url || null,
          }
        : null,
      salon: video.salon
        ? {
            id: video.salon.id,
            name: video.salon.name,
            logo: video.salon.logo_url || null,
          }
        : null,
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

  private parseCursor(cursor?: string): FeedCursor | undefined {
    if (!cursor) return undefined;

    try {
      const decoded = Buffer.from(cursor, 'base64').toString('ascii');
      const separatorIndex = decoded.lastIndexOf('_');
      if (separatorIndex === -1) {
        throw new Error('Invalid cursor format');
      }
      const createdAtStr = decoded.substring(0, separatorIndex);
      const id = decoded.substring(separatorIndex + 1);
      const createdAt = new Date(createdAtStr);

      if (isNaN(createdAt.getTime())) {
        throw new Error('Invalid date in cursor');
      }

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
