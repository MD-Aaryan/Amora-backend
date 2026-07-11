import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private commentInclude = {
    user: {
      select: { id: true, display_name: true, avatar_url: true },
    },
  } as const;

  async create(userId: string, videoId: string, content: string) {
    return this.prisma.videoComment.create({
      data: { user_id: userId, video_id: videoId, content },
      include: this.commentInclude,
    });
  }

  async createReply(
    userId: string,
    videoId: string,
    parentId: string,
    content: string,
  ) {
    return this.prisma.videoComment.create({
      data: {
        user_id: userId,
        video_id: videoId,
        parent_id: parentId,
        content,
      },
      include: this.commentInclude,
    });
  }

  async update(id: string, content: string) {
    return this.prisma.videoComment.update({
      where: { id },
      data: { content },
      include: this.commentInclude,
    });
  }

  async softDelete(id: string) {
    return this.prisma.videoComment.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async findById(id: string) {
    return this.prisma.videoComment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
      },
    });
  }

  async findByVideoId(videoId: string) {
    return this.prisma.videoComment.findMany({
      where: { video_id: videoId, parent_id: null, deleted_at: null },
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
        replies: {
          where: { deleted_at: null },
          include: {
            user: {
              select: { id: true, display_name: true, avatar_url: true },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async incrementCount(videoId: string) {
    return this.prisma.video.update({
      where: { id: videoId },
      data: { comments_count: { increment: 1 } },
    });
  }

  async decrementCount(videoId: string) {
    return this.prisma.video.update({
      where: { id: videoId, comments_count: { gt: 0 } },
      data: { comments_count: { decrement: 1 } },
    });
  }
}
