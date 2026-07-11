import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { LikesRepository } from './likes.repository';
import { VideoRepository } from '../../video/video.repository';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class LikesService {
  constructor(
    private readonly likesRepository: LikesRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async likeVideo(userId: string, videoId: string) {
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

    const existing = await this.likesRepository.findExisting(userId, videoId);
    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'You have already liked this video.',
        error: { code: 'ALREADY_LIKED' },
      });
    }

    await this.likesRepository.create(userId, videoId);
    await this.likesRepository.incrementCount(videoId);

    return { message: 'Video liked successfully.' };
  }

  async unlikeVideo(userId: string, videoId: string) {
    const existing = await this.likesRepository.findExisting(userId, videoId);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Like not found.',
        error: { code: 'LIKE_NOT_FOUND' },
      });
    }

    await this.likesRepository.delete(userId, videoId);
    await this.likesRepository.decrementCount(videoId);

    return { message: 'Video unliked successfully.' };
  }
}
