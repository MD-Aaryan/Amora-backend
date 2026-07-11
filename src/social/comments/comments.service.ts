import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { VideoRepository } from '../../video/video.repository';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async getComments(videoId: string) {
    const video = await this.videoRepository.findPublicById(videoId);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    const comments = await this.commentsRepository.findByVideoId(videoId);

    return {
      items: comments.map((c: any) => ({
        id: c.id,
        videoId: c.video_id,
        content: c.content,
        status: c.updated_at > c.created_at ? 'EDITED' : 'ACTIVE',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        user: {
          id: c.user.id,
          displayName: c.user.display_name,
          avatarUrl: c.user.avatar_url,
        },
        replies: (c.replies || []).map((r: any) => ({
          id: r.id,
          content: r.content,
          status: r.updated_at > r.created_at ? 'EDITED' : 'ACTIVE',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          user: {
            id: r.user.id,
            displayName: r.user.display_name,
            avatarUrl: r.user.avatar_url,
          },
        })),
      })),
    };
  }

  async createComment(userId: string, videoId: string, content: string) {
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

    const comment = await this.commentsRepository.create(
      userId,
      videoId,
      content,
    );
    await this.commentsRepository.incrementCount(videoId);

    this.logger.log(`Comment created: user=${userId} video=${videoId}`);

    return {
      id: comment.id,
      videoId: comment.video_id,
      content: comment.content,
      status: 'ACTIVE',
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        id: comment.user.id,
        displayName: comment.user.display_name,
        avatarUrl: comment.user.avatar_url,
      },
    };
  }

  async replyToComment(userId: string, commentId: string, content: string) {
    const parent = await this.commentsRepository.findById(commentId);
    if (!parent || parent.deleted_at) {
      throw new NotFoundException({
        success: false,
        message: 'Comment not found.',
        error: { code: 'COMMENT_NOT_FOUND' },
      });
    }

    if (parent.parent_id) {
      throw new BadRequestException({
        success: false,
        message: 'Replies cannot have nested replies.',
        error: { code: 'INVALID_REPLY_DEPTH' },
      });
    }

    const comment = await this.commentsRepository.createReply(
      userId,
      parent.video_id,
      commentId,
      content,
    );
    await this.commentsRepository.incrementCount(parent.video_id);

    this.logger.log(`Reply created: user=${userId} parent=${commentId}`);

    return {
      id: comment.id,
      videoId: comment.video_id,
      parentId: comment.parent_id,
      content: comment.content,
      status: 'ACTIVE',
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        id: comment.user.id,
        displayName: comment.user.display_name,
        avatarUrl: comment.user.avatar_url,
      },
    };
  }

  async updateComment(userId: string, commentId: string, content: string) {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment || comment.deleted_at) {
      throw new NotFoundException({
        success: false,
        message: 'Comment not found.',
        error: { code: 'COMMENT_NOT_FOUND' },
      });
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You can only edit your own comments.',
        error: { code: 'NOT_COMMENT_OWNER' },
      });
    }

    const updated = await this.commentsRepository.update(commentId, content);

    this.logger.log(`Comment updated: id=${commentId} user=${userId}`);

    return {
      id: updated.id,
      videoId: updated.video_id,
      content: updated.content,
      status: 'EDITED',
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      user: {
        id: updated.user.id,
        displayName: updated.user.display_name,
        avatarUrl: updated.user.avatar_url,
      },
    };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment || comment.deleted_at) {
      throw new NotFoundException({
        success: false,
        message: 'Comment not found.',
        error: { code: 'COMMENT_NOT_FOUND' },
      });
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You can only delete your own comments.',
        error: { code: 'NOT_COMMENT_OWNER' },
      });
    }

    await this.commentsRepository.softDelete(commentId);
    await this.commentsRepository.decrementCount(comment.video_id);

    this.logger.log(`Comment deleted: id=${commentId} user=${userId}`);

    return { message: 'Comment deleted successfully.' };
  }
}
