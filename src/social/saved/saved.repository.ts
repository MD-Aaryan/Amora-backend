import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ApprovalStatus, VideoStatus, VideoVisibility } from '@prisma/client';

@Injectable()
export class SavedRepository {
  constructor(private readonly prisma: PrismaService) {}

  private savedInclude = {
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

  async create(userId: string, videoId: string) {
    return this.prisma.savedVideo.create({
      data: { user_id: userId, video_id: videoId },
    });
  }

  async delete(userId: string, videoId: string) {
    return this.prisma.savedVideo.delete({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
    });
  }

  async findExisting(userId: string, videoId: string) {
    return this.prisma.savedVideo.findUnique({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.savedVideo.findMany({
      where: {
        user_id: userId,
        video: {
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
      },
      include: this.savedInclude,
      orderBy: { created_at: 'desc' },
    });
  }
}
