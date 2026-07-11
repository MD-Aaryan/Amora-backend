import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoRepository } from './video.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatorRepository } from '../creator/creator.repository';
import { SalonRepository } from '../salon/salon.repository';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoEntity } from './entities/video.entity';
import { RoleName } from '../common/enums/role.enum';
import { ApprovalStatus, VideoVisibility } from '@prisma/client';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  private readonly maxVideoSize: number;
  private readonly maxThumbnailSize: number;
  private readonly allowedVideoTypes: string[];
  private readonly allowedThumbnailTypes: string[];
  private readonly maxVideoSizeMB: number;
  private readonly maxThumbnailSizeMB: number;

  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly creatorRepository: CreatorRepository,
    private readonly salonRepository: SalonRepository,
    private readonly configService: ConfigService,
  ) {
    this.maxVideoSizeMB = this.configService.get<number>(
      'VIDEO_MAX_SIZE_MB',
      200,
    );
    this.maxThumbnailSizeMB = this.configService.get<number>(
      'THUMBNAIL_MAX_SIZE_MB',
      5,
    );
    this.maxVideoSize = this.maxVideoSizeMB * 1024 * 1024;
    this.maxThumbnailSize = this.maxThumbnailSizeMB * 1024 * 1024;
    this.allowedVideoTypes = this.configService
      .get<string>(
        'ALLOWED_VIDEO_TYPES',
        'video/mp4,video/quicktime,video/webm',
      )
      .split(',');
    this.allowedThumbnailTypes = this.configService
      .get<string>('ALLOWED_THUMBNAIL_TYPES', 'image/jpeg,image/png,image/webp')
      .split(',');
  }

  async upload(
    userId: string,
    activeRole: string,
    dto: CreateVideoDto,
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File,
  ): Promise<VideoEntity> {
    this.validateVideoFile(videoFile);
    this.validateThumbnailFile(thumbnailFile);

    const partnerType = activeRole as RoleName;
    if (partnerType !== RoleName.CREATOR && partnerType !== RoleName.SALON) {
      throw new ForbiddenException({
        success: false,
        message: 'Only approved creators and salon partners can upload videos.',
        error: { code: 'UPLOAD_NOT_ALLOWED' },
      });
    }

    const profileId = await this.getApprovedProfileId(userId, partnerType);

    for (const categoryId of dto.category_ids) {
      const exists = await this.videoRepository.categoryExists(categoryId);
      if (!exists) {
        throw new BadRequestException({
          success: false,
          message: `Category ${categoryId} does not exist.`,
          error: { code: 'CATEGORY_NOT_FOUND' },
        });
      }
    }

    let thumbnailResult: { url: string; publicId: string };
    try {
      thumbnailResult =
        await this.cloudinaryService.uploadImageWithPublicId(thumbnailFile);
    } catch {
      throw new BadRequestException({
        success: false,
        message: 'Failed to upload thumbnail.',
        error: { code: 'THUMBNAIL_UPLOAD_FAILED' },
      });
    }

    let videoResult: { url: string; publicId: string };
    try {
      videoResult = await this.cloudinaryService.uploadVideo(videoFile);
    } catch {
      await this.cloudinaryService
        .deleteByPublicId(thumbnailResult.publicId)
        .catch(() => {});
      throw new BadRequestException({
        success: false,
        message: 'Failed to upload video.',
        error: { code: 'VIDEO_UPLOAD_FAILED' },
      });
    }

    try {
      const video = await this.videoRepository.create({
        creator_id: partnerType === RoleName.CREATOR ? profileId : undefined,
        salon_id: partnerType === RoleName.SALON ? profileId : undefined,
        cloudinary_public_id: videoResult.publicId,
        thumbnail_public_id: thumbnailResult.publicId,
        title: dto.title,
        description: dto.description,
        video_url: videoResult.url,
        thumbnail_url: thumbnailResult.url,
        language: dto.language || 'en',
        visibility: dto.visibility || VideoVisibility.PUBLIC,
        categoryIds: dto.category_ids,
        tagNames: dto.tags || [],
      });

      this.logger.log(`Video uploaded: ${video.id} by user ${userId}`);
      return this.mapToEntity(video);
    } catch (error) {
      await this.cloudinaryService
        .deleteByPublicId(videoResult.publicId, 'video')
        .catch(() => {});
      await this.cloudinaryService
        .deleteByPublicId(thumbnailResult.publicId)
        .catch(() => {});
      throw error;
    }
  }

  async getMyVideos(userId: string, activeRole: string) {
    const partnerType = activeRole as RoleName;
    const profileId = await this.getOwnerProfileId(userId, partnerType);

    const videos = await this.videoRepository.findMyVideos(
      partnerType === RoleName.CREATOR ? profileId : undefined,
      partnerType === RoleName.SALON ? profileId : undefined,
    );

    return videos.map((v: any) => ({
      id: v.id,
      thumbnailUrl: v.thumbnail_url,
      title: v.title,
      category: v.categories?.[0]?.category?.name || null,
      visibility: v.visibility,
      status: v.status,
      viewsCount: v.views_count,
      likesCount: v.likes_count,
      commentsCount: v.comments_count,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    }));
  }

  async getVideoById(
    userId: string,
    activeRole: string,
    videoId: string,
  ): Promise<VideoEntity> {
    const profileId = await this.getOwnerProfileId(
      userId,
      activeRole as RoleName,
    );
    const partnerType = activeRole as RoleName;

    const video = await this.videoRepository.findOwnedVideo(
      videoId,
      partnerType === RoleName.CREATOR ? profileId : undefined,
      partnerType === RoleName.SALON ? profileId : undefined,
    );

    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    return this.mapToEntity(video);
  }

  async updateVideo(
    userId: string,
    activeRole: string,
    videoId: string,
    dto: UpdateVideoDto,
  ): Promise<VideoEntity> {
    const profileId = await this.getOwnerProfileId(
      userId,
      activeRole as RoleName,
    );
    const partnerType = activeRole as RoleName;

    const existing = await this.videoRepository.findOwnedVideo(
      videoId,
      partnerType === RoleName.CREATOR ? profileId : undefined,
      partnerType === RoleName.SALON ? profileId : undefined,
    );

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    if (dto.category_ids) {
      for (const categoryId of dto.category_ids) {
        const exists = await this.videoRepository.categoryExists(categoryId);
        if (!exists) {
          throw new BadRequestException({
            success: false,
            message: `Category ${categoryId} does not exist.`,
            error: { code: 'CATEGORY_NOT_FOUND' },
          });
        }
      }
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category_ids !== undefined)
      updateData.categoryIds = dto.category_ids;
    if (dto.tags !== undefined) updateData.tagNames = dto.tags;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.visibility !== undefined)
      updateData.visibility = dto.visibility as VideoVisibility;
    if (dto.is_free !== undefined) updateData.is_free = dto.is_free;
    if (dto.price !== undefined) updateData.price = dto.price;

    const updated = await this.videoRepository.update(videoId, updateData);
    this.logger.log(`Video updated: ${videoId} by user ${userId}`);
    return this.mapToEntity(updated);
  }

  async deleteVideo(userId: string, activeRole: string, videoId: string) {
    const profileId = await this.getOwnerProfileId(
      userId,
      activeRole as RoleName,
    );
    const partnerType = activeRole as RoleName;

    const existing = await this.videoRepository.findOwnedVideo(
      videoId,
      partnerType === RoleName.CREATOR ? profileId : undefined,
      partnerType === RoleName.SALON ? profileId : undefined,
    );

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    if (existing.cloudinary_public_id) {
      await this.cloudinaryService
        .deleteByPublicId(existing.cloudinary_public_id, 'video')
        .catch(() => {});
    }

    const thumbnailPublicId =
      existing.thumbnail_public_id ||
      this.cloudinaryService.extractPublicId(existing.thumbnail_url);
    if (thumbnailPublicId) {
      await this.cloudinaryService
        .deleteByPublicId(thumbnailPublicId)
        .catch(() => {});
    }

    await this.videoRepository.softDelete(videoId);
    this.logger.log(`Video deleted: ${videoId} by user ${userId}`);

    return { message: 'Video deleted successfully.' };
  }

  async replaceThumbnail(
    userId: string,
    activeRole: string,
    videoId: string,
    file: Express.Multer.File,
  ): Promise<VideoEntity> {
    this.validateThumbnailFile(file);

    const profileId = await this.getOwnerProfileId(
      userId,
      activeRole as RoleName,
    );
    const partnerType = activeRole as RoleName;

    const existing = await this.videoRepository.findOwnedVideo(
      videoId,
      partnerType === RoleName.CREATOR ? profileId : undefined,
      partnerType === RoleName.SALON ? profileId : undefined,
    );

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    const oldThumbnailPublicId =
      existing.thumbnail_public_id ||
      this.cloudinaryService.extractPublicId(existing.thumbnail_url);

    let result: { url: string; publicId: string };
    try {
      result = await this.cloudinaryService.uploadImageWithPublicId(file);
    } catch {
      throw new BadRequestException({
        success: false,
        message: 'Failed to upload new thumbnail.',
        error: { code: 'THUMBNAIL_UPLOAD_FAILED' },
      });
    }

    if (oldThumbnailPublicId) {
      await this.cloudinaryService
        .deleteByPublicId(oldThumbnailPublicId)
        .catch(() => {});
    }

    const updated = await this.videoRepository.update(videoId, {
      thumbnail_url: result.url,
      thumbnail_public_id: result.publicId,
    });

    this.logger.log(
      `Thumbnail replaced for video: ${videoId} by user ${userId}`,
    );
    return this.mapToEntity(updated);
  }

  async replaceVideoFile(
    userId: string,
    activeRole: string,
    videoId: string,
    file: Express.Multer.File,
  ): Promise<VideoEntity> {
    this.validateVideoFile(file);

    const profileId = await this.getOwnerProfileId(
      userId,
      activeRole as RoleName,
    );
    const partnerType = activeRole as RoleName;

    const existing = await this.videoRepository.findOwnedVideo(
      videoId,
      partnerType === RoleName.CREATOR ? profileId : undefined,
      partnerType === RoleName.SALON ? profileId : undefined,
    );

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    const oldVideoPublicId = existing.cloudinary_public_id;

    let result: { url: string; publicId: string };
    try {
      result = await this.cloudinaryService.uploadVideo(file);
    } catch {
      throw new BadRequestException({
        success: false,
        message: 'Failed to upload new video file.',
        error: { code: 'VIDEO_UPLOAD_FAILED' },
      });
    }

    if (oldVideoPublicId) {
      await this.cloudinaryService
        .deleteByPublicId(oldVideoPublicId, 'video')
        .catch(() => {});
    }

    const updated = await this.videoRepository.update(videoId, {
      video_url: result.url,
      cloudinary_public_id: result.publicId,
    });

    this.logger.log(`Video file replaced: ${videoId} by user ${userId}`);
    return this.mapToEntity(updated);
  }

  async getPublicVideo(id: string): Promise<VideoEntity> {
    const video = await this.videoRepository.findPublicById(id);
    if (!video) {
      throw new NotFoundException({
        success: false,
        message: 'Video not found.',
        error: { code: 'VIDEO_NOT_FOUND' },
      });
    }

    return this.mapToEntity(video);
  }

  private async getApprovedProfileId(
    userId: string,
    partnerType: RoleName,
  ): Promise<string> {
    if (partnerType === RoleName.CREATOR) {
      const profile = await this.creatorRepository.findByUserId(userId);
      if (!profile) {
        throw new NotFoundException({
          success: false,
          message: 'Creator profile not found.',
          error: { code: 'PROFILE_NOT_FOUND' },
        });
      }
      if (profile.status !== ApprovalStatus.APPROVED) {
        throw new ForbiddenException({
          success: false,
          message: 'Creator account is not approved.',
          error: { code: 'CREATOR_NOT_APPROVED' },
        });
      }
      return profile.id;
    }

    if (partnerType === RoleName.SALON) {
      const profile = await this.salonRepository.findByUserId(userId);
      if (!profile) {
        throw new NotFoundException({
          success: false,
          message: 'Salon profile not found.',
          error: { code: 'PROFILE_NOT_FOUND' },
        });
      }
      if (profile.status !== ApprovalStatus.APPROVED) {
        throw new ForbiddenException({
          success: false,
          message: 'Salon account is not approved.',
          error: { code: 'SALON_NOT_APPROVED' },
        });
      }
      return profile.id;
    }

    throw new ForbiddenException({
      success: false,
      message:
        'Only approved creators and salon partners can perform this action.',
      error: { code: 'ACTION_NOT_ALLOWED' },
    });
  }

  private async getOwnerProfileId(
    userId: string,
    partnerType: RoleName,
  ): Promise<string> {
    if (partnerType === RoleName.CREATOR) {
      const profile = await this.creatorRepository.findByUserId(userId);
      if (!profile) {
        throw new NotFoundException({
          success: false,
          message: 'Creator profile not found.',
          error: { code: 'PROFILE_NOT_FOUND' },
        });
      }
      return profile.id;
    }

    if (partnerType === RoleName.SALON) {
      const profile = await this.salonRepository.findByUserId(userId);
      if (!profile) {
        throw new NotFoundException({
          success: false,
          message: 'Salon profile not found.',
          error: { code: 'PROFILE_NOT_FOUND' },
        });
      }
      return profile.id;
    }

    throw new ForbiddenException({
      success: false,
      message: 'Only creators and salon partners can perform this action.',
      error: { code: 'ACTION_NOT_ALLOWED' },
    });
  }

  private validateVideoFile(file: Express.Multer.File): void {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Video file is required.',
        error: { code: 'VIDEO_FILE_REQUIRED' },
      });
    }

    if (file.size > this.maxVideoSize) {
      throw new BadRequestException({
        success: false,
        message: `Video file too large. Maximum size is ${this.maxVideoSizeMB}MB.`,
        error: { code: 'VIDEO_FILE_TOO_LARGE' },
      });
    }

    if (!this.allowedVideoTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid video format. Only MP4, MOV, and WEBM are allowed.',
        error: { code: 'INVALID_VIDEO_TYPE' },
      });
    }
  }

  private validateThumbnailFile(file: Express.Multer.File): void {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Thumbnail file is required.',
        error: { code: 'THUMBNAIL_FILE_REQUIRED' },
      });
    }

    if (file.size > this.maxThumbnailSize) {
      throw new BadRequestException({
        success: false,
        message: `Thumbnail file too large. Maximum size is ${this.maxThumbnailSizeMB}MB.`,
        error: { code: 'THUMBNAIL_FILE_TOO_LARGE' },
      });
    }

    if (!this.allowedThumbnailTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        success: false,
        message:
          'Invalid thumbnail format. Only JPG, PNG, and WEBP are allowed.',
        error: { code: 'INVALID_THUMBNAIL_TYPE' },
      });
    }
  }

  private mapToEntity(video: any): VideoEntity {
    const ownerName =
      video.creator?.user?.display_name ||
      video.salon?.user?.display_name ||
      null;
    const ownerAvatar =
      video.creator?.user?.avatar_url || video.salon?.user?.avatar_url || null;
    const partnerType = video.creator
      ? 'CREATOR'
      : video.salon
        ? 'SALON'
        : null;

    return {
      id: video.id,
      title: video.title,
      description: video.description || null,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url,
      duration: video.duration,
      language: video.language,
      visibility: video.visibility,
      status: video.status,
      isFree: video.is_free,
      price: video.price ? Number(video.price) : null,
      categories: (video.categories || []).map((vc: any) => ({
        id: vc.category.id,
        name: vc.category.name,
      })),
      tags: (video.tags || []).map((vt: any) => vt.tag.name),
      ownerName,
      ownerAvatar,
      partnerType: partnerType,
      viewsCount: video.views_count,
      likesCount: video.likes_count,
      commentsCount: video.comments_count,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
    };
  }
}
