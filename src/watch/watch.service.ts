import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { WatchRepository } from './watch.repository';
import { UpdateWatchHistoryDto } from './dto/update-watch-history.dto';

@Injectable()
export class WatchService {
  private readonly logger = new Logger(WatchService.name);

  constructor(private readonly watchRepository: WatchRepository) {}

  async watchVideo(videoId: string, userId?: string) {
    const video = await this.watchRepository.findVideoForWatching(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    await this.watchRepository.incrementViewCount(videoId);

    let resumePosition: number | null = null;

    if (userId) {
      const existing = await this.watchRepository.findWatchHistory(
        userId,
        videoId,
      );
      if (existing) {
        resumePosition = existing.last_position;
      }
      await this.watchRepository.upsertWatchHistory(userId, videoId, {
        lastPosition: resumePosition ?? 0,
        completed: false,
      });
      this.logger.log(`Watch history updated: user=${userId} video=${videoId}`);
    }

    const categoryIds = (video.categories || []).map(
      (vc: any) => vc.category_id,
    );
    const relatedVideos =
      categoryIds.length > 0
        ? await this.watchRepository.findRelatedVideos(videoId, categoryIds)
        : [];

    let creatorInfo: any = null;
    if (video.creator) {
      const followerCount = await this.watchRepository.getCreatorFollowerCount(
        video.creator.user_id,
      );
      creatorInfo = {
        id: video.creator.id,
        name: video.creator.user?.display_name || null,
        avatar: video.creator.user?.avatar_url || null,
        isVerified: video.creator.is_verified,
        followerCount,
        bio: video.creator.bio || null,
      };
    }

    let salonInfo: any = null;
    if (video.salon) {
      const avgRating = await this.watchRepository.getSalonAverageRating(
        video.salon.id,
      );
      salonInfo = {
        id: video.salon.id,
        name: video.salon.name,
        logo: video.salon.logo_url || null,
        isVerified: video.salon.is_verified,
        address: video.salon.address,
        rating: avgRating ? Number(avgRating.toFixed(1)) : null,
      };
    }

    return {
      id: video.id,
      title: video.title,
      description: video.description || null,
      thumbnailUrl: video.thumbnail_url,
      streamingUrl: video.video_url,
      duration: video.duration,
      language: video.language,
      visibility: video.visibility,
      viewsCount: video.views_count + 1,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
      categories: (video.categories || []).map((vc: any) => ({
        id: vc.category.id,
        name: vc.category.name,
      })),
      tags: (video.tags || []).map((vt: any) => vt.tag.name),
      creator: creatorInfo,
      salon: salonInfo,
      relatedVideos: relatedVideos.map((rv: any) => ({
        id: rv.id,
        title: rv.title,
        thumbnailUrl: rv.thumbnail_url,
        duration: rv.duration,
        viewsCount: rv.views_count,
        createdAt: rv.created_at,
        creatorName:
          rv.creator?.user?.display_name ||
          rv.salon?.user?.display_name ||
          null,
        creatorAvatar:
          rv.creator?.user?.avatar_url || rv.salon?.user?.avatar_url || null,
      })),
      resumePosition,
    };
  }

  async getRelatedVideos(videoId: string) {
    const video = await this.watchRepository.findVideoForWatching(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    const categoryIds = (video.categories || []).map(
      (vc: any) => vc.category_id,
    );
    if (categoryIds.length === 0) {
      return { items: [] };
    }

    const relatedVideos = await this.watchRepository.findRelatedVideos(
      videoId,
      categoryIds,
    );

    return {
      items: relatedVideos.map((rv: any) => ({
        id: rv.id,
        title: rv.title,
        thumbnailUrl: rv.thumbnail_url,
        duration: rv.duration,
        viewsCount: rv.views_count,
        createdAt: rv.created_at,
        creatorName:
          rv.creator?.user?.display_name ||
          rv.salon?.user?.display_name ||
          null,
        creatorAvatar:
          rv.creator?.user?.avatar_url || rv.salon?.user?.avatar_url || null,
      })),
    };
  }

  async updateWatchHistory(userId: string, dto: UpdateWatchHistoryDto) {
    const history = await this.watchRepository.findWatchHistory(
      userId,
      dto.videoId,
    );
    if (!history) {
      throw new NotFoundException({
        success: false,
        message: 'Watch history not found. Open the video first.',
        error: { code: 'WATCH_HISTORY_NOT_FOUND' },
      });
    }

    await this.watchRepository.updateWatchHistory(userId, dto.videoId, {
      lastPosition: dto.lastPosition,
      watchDuration: dto.watchDuration,
      completed: dto.completed ?? false,
    });

    this.logger.log(
      `Watch history updated: user=${userId} video=${dto.videoId} position=${dto.lastPosition}`,
    );

    return { message: 'Watch history updated successfully.' };
  }

  async getWatchHistory(userId: string) {
    const history = await this.watchRepository.getUserWatchHistory(userId);

    return {
      items: history.map((h: any) => ({
        id: h.id,
        videoId: h.video_id,
        lastPosition: h.last_position,
        completed: h.completed,
        watchedAt: h.watched_at,
        video: {
          id: h.video.id,
          title: h.video.title,
          thumbnailUrl: h.video.thumbnail_url,
          duration: h.video.duration,
          viewsCount: h.video.views_count,
          createdAt: h.video.created_at,
          creatorName:
            h.video.creator?.user?.display_name ||
            h.video.salon?.user?.display_name ||
            null,
          creatorAvatar:
            h.video.creator?.user?.avatar_url ||
            h.video.salon?.user?.avatar_url ||
            null,
        },
      })),
    };
  }

  async clearWatchHistory(userId: string) {
    await this.watchRepository.clearWatchHistory(userId);
    this.logger.log(`Watch history cleared: user=${userId}`);
    return { message: 'Watch history cleared successfully.' };
  }
}
