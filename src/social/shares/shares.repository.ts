import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SharesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(videoId: string, userId?: string) {
    return this.prisma.videoShare.create({
      data: { video_id: videoId, user_id: userId || null },
    });
  }

  async incrementCount(videoId: string) {
    return this.prisma.video.update({
      where: { id: videoId },
      data: { shares_count: { increment: 1 } },
    });
  }

  async getCount(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { shares_count: true },
    });
    return video?.shares_count || 0;
  }
}
