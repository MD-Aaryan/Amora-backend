import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SavedRepository } from './saved.repository';
import { VideoRepository } from '../../video/video.repository';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class SavedService {
  constructor(
    private readonly savedRepository: SavedRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async saveVideo(userId: string, videoId: string) {
    const video = await this.videoRepository.findPublicById(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    const isApproved =
      video.creator?.status === ApprovalStatus.APPROVED ||
      video.salon?.status === ApprovalStatus.APPROVED;
    if (!isApproved) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    const existing = await this.savedRepository.findExisting(userId, videoId);
    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'Video already saved.',
        error: { code: 'ALREADY_SAVED' },
      });
    }

    await this.savedRepository.create(userId, videoId);
    return { message: 'Video saved successfully.' };
  }

  async removeSaved(userId: string, videoId: string) {
    const existing = await this.savedRepository.findExisting(userId, videoId);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Saved video not found.',
        error: { code: 'SAVED_NOT_FOUND' },
      });
    }

    await this.savedRepository.delete(userId, videoId);
    return { message: 'Saved video removed successfully.' };
  }

  async getSavedVideos(userId: string) {
    const savedList = await this.savedRepository.findAllByUser(userId);

    return {
      items: savedList.map((s: any) => ({
        id: s.id,
        videoId: s.video_id,
        savedAt: s.created_at,
        video: {
          id: s.video.id,
          title: s.video.title,
          thumbnailUrl: s.video.thumbnail_url,
          duration: s.video.duration,
          viewsCount: s.video.views_count,
          createdAt: s.video.created_at,
          creatorName:
            s.video.creator?.user?.display_name ||
            s.video.salon?.user?.display_name ||
            null,
          creatorAvatar:
            s.video.creator?.user?.avatar_url ||
            s.video.salon?.user?.avatar_url ||
            null,
        },
      })),
    };
  }
}
