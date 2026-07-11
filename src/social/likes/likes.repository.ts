import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LikesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, videoId: string) {
    return this.prisma.videoLike.create({
      data: { user_id: userId, video_id: videoId },
    });
  }

  async delete(userId: string, videoId: string) {
    return this.prisma.videoLike.delete({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
    });
  }

  async findExisting(userId: string, videoId: string) {
    return this.prisma.videoLike.findUnique({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
    });
  }

  async incrementCount(videoId: string) {
    return this.prisma.video.update({
      where: { id: videoId },
      data: { likes_count: { increment: 1 } },
    });
  }

  async decrementCount(videoId: string) {
    return this.prisma.video.update({
      where: { id: videoId, likes_count: { gt: 0 } },
      data: { likes_count: { decrement: 1 } },
    });
  }
}
