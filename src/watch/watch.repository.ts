import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApprovalStatus, VideoStatus, VideoVisibility } from '@prisma/client';

@Injectable()
export class WatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  private videoInclude = {
    categories: { include: { category: true } },
    tags: { include: { tag: true } },
    creator: {
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
      },
    },
    salon: {
      include: {
        user: { select: { display_name: true, avatar_url: true } },
      },
    },
  } as const;

  private relatedInclude = {
    categories: { include: { category: true } },
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

  private watchHistoryInclude = {
    video: {
      include: {
        categories: { include: { category: true } },
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
      },
    },
  } as const;

  async findVideoForWatching(videoId: string) {
    return this.prisma.video.findFirst({
      where: {
        id: videoId,
        visibility: VideoVisibility.PUBLIC,
        status: VideoStatus.ACTIVE,
        deleted_at: null,
        AND: [
          {
            OR: [
              { creator: { status: ApprovalStatus.APPROVED } },
              { salon: { status: ApprovalStatus.APPROVED } },
            ],
          },
        ],
      },
      include: this.videoInclude,
    });
  }

  async incrementViewCount(videoId: string) {
    return this.prisma.video.update({
      where: { id: videoId },
      data: { views_count: { increment: 1 } },
    });
  }

  async findRelatedVideos(videoId: string, categoryIds: string[], limit = 10) {
    return this.prisma.video.findMany({
      where: {
        id: { not: videoId },
        visibility: VideoVisibility.PUBLIC,
        status: VideoStatus.ACTIVE,
        deleted_at: null,
        categories: {
          some: { category_id: { in: categoryIds } },
        },
        AND: [
          {
            OR: [
              { creator: { status: ApprovalStatus.APPROVED } },
              { salon: { status: ApprovalStatus.APPROVED } },
            ],
          },
        ],
      },
      include: this.relatedInclude,
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async findWatchHistory(userId: string, videoId: string) {
    return this.prisma.watchHistory.findUnique({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
    });
  }

  async upsertWatchHistory(
    userId: string,
    videoId: string,
    data: { lastPosition: number; watchDuration?: number; completed: boolean },
  ) {
    return this.prisma.watchHistory.upsert({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
      create: {
        user_id: userId,
        video_id: videoId,
        last_position: data.lastPosition,
        watch_duration: data.watchDuration,
        completed: data.completed,
      },
      update: {
        last_position: data.lastPosition,
        watch_duration: data.watchDuration,
        completed: data.completed,
        watched_at: new Date(),
      },
    });
  }

  async updateWatchHistory(
    userId: string,
    videoId: string,
    data: { lastPosition: number; watchDuration?: number; completed?: boolean },
  ) {
    const updateData: any = {
      last_position: data.lastPosition,
      watched_at: new Date(),
    };
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.watchDuration !== undefined)
      updateData.watch_duration = data.watchDuration;

    return this.prisma.watchHistory.update({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
      data: updateData,
    });
  }

  async getUserWatchHistory(userId: string) {
    return this.prisma.watchHistory.findMany({
      where: { user_id: userId },
      include: this.watchHistoryInclude,
      orderBy: { watched_at: 'desc' },
      take: 50,
    });
  }

  async clearWatchHistory(userId: string) {
    return this.prisma.watchHistory.deleteMany({
      where: { user_id: userId },
    });
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
