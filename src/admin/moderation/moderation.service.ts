import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ModerationRepository } from './moderation.repository';
import { VideoStatus, VideoVisibility } from '@prisma/client';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private readonly moderationRepository: ModerationRepository) {}

  async listVideos(params: {
    cursor?: string;
    limit?: number;
    status?: string;
    categoryId?: string;
    creatorName?: string;
    sort?: string;
  }) {
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const statusMap: Record<string, VideoStatus> = {
      published: VideoStatus.ACTIVE,
      hidden: VideoStatus.BLOCKED,
      deleted: VideoStatus.DELETED,
      draft: VideoStatus.DRAFT,
      processing: VideoStatus.PROCESSING,
    };

    const status = params.status
      ? statusMap[params.status.toLowerCase()]
      : undefined;

    const result = await this.moderationRepository.findMany({
      cursor: params.cursor,
      limit,
      status,
      categoryId: params.categoryId,
      creatorName: params.creatorName,
      sort: params.sort,
    });

    const videos = result.videos as any[];

    return {
      items: videos.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description || null,
        thumbnailUrl: v.thumbnail_url,
        videoUrl: v.video_url,
        duration: v.duration,
        viewsCount: v.views_count,
        likesCount: v.likes_count,
        commentsCount: v.comments_count,
        sharesCount: v.shares_count,
        status: v.status,
        visibility: v.visibility,
        language: v.language,
        isFree: v.is_free,
        creatorName: v.creator?.user?.display_name || null,
        creatorAvatar: v.creator?.user?.avatar_url || null,
        salonName: v.salon?.name || null,
        categories:
          v.categories?.map((c: any) => ({
            id: c.category.id,
            name: c.category.name,
            slug: c.category.slug,
          })) || [],
        reportCount: v.reports?.length || 0,
        createdAt: v.created_at,
      })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async getVideoById(videoId: string) {
    const video = (await this.moderationRepository.findById(videoId)) as any;
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    return {
      id: video.id,
      title: video.title,
      description: video.description || null,
      thumbnailUrl: video.thumbnail_url,
      videoUrl: video.video_url,
      duration: video.duration,
      viewsCount: video.views_count,
      likesCount: video.likes_count,
      commentsCount: video.comments_count,
      sharesCount: video.shares_count,
      status: video.status,
      visibility: video.visibility,
      language: video.language,
      isFree: video.is_free,
      price: video.price ? Number(video.price) : null,
      creator: video.creator
        ? {
            id: video.creator.id,
            displayName: video.creator.user?.display_name || null,
            username: video.creator.user?.username || null,
            avatarUrl: video.creator.user?.avatar_url || null,
            email: video.creator.user?.email || null,
          }
        : null,
      salon: video.salon || null,
      categories:
        video.categories?.map((c: any) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
        })) || [],
      reports:
        video.reports?.map((r: any) => ({
          id: r.id,
          reporterName: r.reporter?.display_name || null,
          reason: r.reason,
          details: r.details || null,
          status: r.status,
          createdAt: r.created_at,
        })) || [],
      createdAt: video.created_at,
      updatedAt: video.updated_at,
    };
  }

  async hideVideo(videoId: string) {
    const video = await this.moderationRepository.findById(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    if (video.status === VideoStatus.BLOCKED) {
      throw new BadRequestException({
        success: false,
        message: 'Video is already hidden.',
        error: { code: 'ALREADY_HIDDEN' },
      });
    }

    const updated = await this.moderationRepository.updateStatus(
      videoId,
      VideoStatus.BLOCKED,
    );

    this.logger.log(`Video ${videoId} hidden`);

    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      message: 'Video hidden successfully.',
    };
  }

  async restoreVideo(videoId: string) {
    const video = await this.moderationRepository.findById(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    if (video.status !== VideoStatus.DELETED) {
      throw new BadRequestException({
        success: false,
        message: 'Video is not deleted.',
        error: { code: 'VIDEO_NOT_DELETED' },
      });
    }

    const updated = await this.moderationRepository.updateStatus(
      videoId,
      VideoStatus.ACTIVE,
      VideoVisibility.PUBLIC,
    );

    this.logger.log(`Video ${videoId} restored`);

    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      message: 'Video restored successfully.',
    };
  }

  async softDeleteVideo(videoId: string) {
    const video = await this.moderationRepository.findById(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    if (video.status === VideoStatus.DELETED) {
      throw new BadRequestException({
        success: false,
        message: 'Video is already deleted.',
        error: { code: 'ALREADY_DELETED' },
      });
    }

    const updated = await this.moderationRepository.softDelete(videoId);

    this.logger.log(`Video ${videoId} soft deleted`);

    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      message: 'Video deleted successfully.',
    };
  }
}
