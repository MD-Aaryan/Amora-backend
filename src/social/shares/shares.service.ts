import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SharesRepository } from './shares.repository';
import { VideoRepository } from '../../video/video.repository';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class SharesService {
  private readonly logger = new Logger(SharesService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly sharesRepository: SharesRepository,
    private readonly videoRepository: VideoRepository,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://amora.app',
    );
  }

  async shareVideo(videoId: string, userId?: string) {
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

    await this.sharesRepository.create(videoId, userId);
    await this.sharesRepository.incrementCount(videoId);

    const shareUrl = `${this.frontendUrl}/watch/${videoId}`;
    const shareCount = await this.sharesRepository.getCount(videoId);

    this.logger.log(`Video shared: video=${videoId}`);

    return { shareUrl, shareCount };
  }

  async getShareInfo(videoId: string) {
    const video = await this.videoRepository.findPublicById(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    const shareUrl = `${this.frontendUrl}/watch/${videoId}`;
    const shareCount = await this.sharesRepository.getCount(videoId);

    return { shareUrl, shareCount };
  }
}
