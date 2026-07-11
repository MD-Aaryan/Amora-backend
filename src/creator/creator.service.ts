import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CreatorRepository } from './creator.repository';
import { UsersRepository } from '../users/users.repository';
import { ApplyCreatorDto } from './dto/apply-creator.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { CreatorProfileEntity } from './entities/creator-profile.entity';
import { CreatorDashboardEntity } from './entities/creator-dashboard.entity';
import {
  ApprovalStatus,
  KycStatus,
  UserStatus,
  VideoStatus,
} from '@prisma/client';

@Injectable()
export class CreatorService {
  private readonly logger = new Logger(CreatorService.name);

  constructor(
    private readonly creatorRepository: CreatorRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async apply(userId: string, dto: ApplyCreatorDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    if (
      user.status === UserStatus.BLOCKED ||
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DELETED
    ) {
      throw new ForbiddenException({
        success: false,
        message: 'Account is not eligible.',
        error: { code: 'ACCOUNT_INELIGIBLE' },
      });
    }

    const existingProfile = await this.creatorRepository.findByUserId(userId);
    if (existingProfile) {
      if (existingProfile.status === ApprovalStatus.PENDING) {
        throw new ConflictException({
          success: false,
          message: 'Creator application already pending.',
          error: { code: 'APPLICATION_PENDING' },
        });
      }
      if (existingProfile.status === ApprovalStatus.APPROVED) {
        throw new ConflictException({
          success: false,
          message: 'Already a creator.',
          error: { code: 'ALREADY_CREATOR' },
        });
      }
      throw new ConflictException({
        success: false,
        message: 'Creator application already exists.',
        error: { code: 'APPLICATION_EXISTS' },
      });
    }

    const profile = await this.creatorRepository.createProfile(userId, {
      bio: dto.bio,
      instagram_handle: dto.instagram_handle,
      tiktok_handle: dto.tiktok_handle,
      youtube_handle: dto.youtube_handle,
      website_url: dto.website_url,
    });

    await this.creatorRepository.createKyc(profile.id, {
      full_name: dto.kyc_full_name,
      id_type: dto.kyc_id_type,
      id_number: dto.kyc_id_number,
      id_front_url: dto.kyc_id_front_url,
      id_back_url: dto.kyc_id_back_url,
      selfie_url: dto.kyc_selfie_url,
    });

    this.logger.log(`Creator application submitted for user ${userId}`);

    return {
      profileId: profile.id,
      status: profile.status,
      message:
        'Creator application submitted successfully. Awaiting admin review.',
    };
  }

  async getProfile(userId: string): Promise<CreatorProfileEntity> {
    const profile = await this.creatorRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator profile not found.',
        error: { code: 'PROFILE_NOT_FOUND' },
      });
    }

    return this.mapProfileToEntity(profile);
  }

  async updateProfile(
    userId: string,
    dto: UpdateCreatorProfileDto,
  ): Promise<CreatorProfileEntity> {
    const profile = await this.creatorRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator profile not found.',
        error: { code: 'PROFILE_NOT_FOUND' },
      });
    }

    const data: Record<string, unknown> = {};
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.instagram_handle !== undefined)
      data.instagram_handle = dto.instagram_handle;
    if (dto.tiktok_handle !== undefined) data.tiktok_handle = dto.tiktok_handle;
    if (dto.youtube_handle !== undefined)
      data.youtube_handle = dto.youtube_handle;
    if (dto.website_url !== undefined) data.website_url = dto.website_url;

    const updated = await this.creatorRepository.updateProfile(
      profile.id,
      data,
    );
    return this.mapProfileToEntity(updated);
  }

  async getDashboard(userId: string): Promise<CreatorDashboardEntity> {
    const profile = await this.creatorRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator profile not found.',
        error: { code: 'PROFILE_NOT_FOUND' },
      });
    }

    const [followersCount, videoCount] = await Promise.all([
      this.creatorRepository.countFollowers(userId),
      this.creatorRepository.countVideos(profile.id),
    ]);

    return {
      creatorName: profile.user?.display_name || null,
      profilePicture: profile.user?.avatar_url || null,
      creatorId: profile.id,
      verificationStatus: profile.status,
      followersCount,
      videoCount,
    };
  }

  async getVerification(userId: string) {
    const profile = await this.creatorRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator profile not found.',
        error: { code: 'PROFILE_NOT_FOUND' },
      });
    }

    return {
      status: profile.kyc?.status || KycStatus.PENDING,
      submittedAt: profile.kyc?.submitted_at || null,
      reviewedAt: profile.kyc?.reviewed_at || null,
      rejectionReason: profile.kyc?.rejection_reason || null,
    };
  }

  async getVideos(userId: string) {
    const profile = await this.creatorRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator profile not found.',
        error: { code: 'PROFILE_NOT_FOUND' },
      });
    }

    const videos = await this.creatorRepository.findVideosByCreatorId(
      profile.id,
    );

    const drafts: any[] = [];
    const published: any[] = [];

    for (const v of videos) {
      const item = {
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnail_url,
        duration: v.duration,
        viewsCount: v.views_count,
        likesCount: v.likes_count,
        commentsCount: v.comments_count,
        categories: v.categories?.map((c) => c.category.name),
        createdAt: v.created_at,
      };

      if (v.status === VideoStatus.DRAFT) {
        drafts.push(item);
      } else {
        published.push(item);
      }
    }

    return { drafts, published };
  }

  async getApplications() {
    return this.creatorRepository.findPendingApplications();
  }

  async approveCreator(profileId: string, adminUserId: string) {
    const profile = await this.creatorRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator application not found.',
        error: { code: 'APPLICATION_NOT_FOUND' },
      });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        message: 'Application is not pending.',
        error: { code: 'APPLICATION_NOT_PENDING' },
      });
    }

    await this.creatorRepository.approveApplication(profileId, adminUserId);

    await this.usersRepository.assignRole(profile.user_id, 'CREATOR');

    this.logger.log(`Creator ${profileId} approved by admin ${adminUserId}`);

    return { message: 'Creator approved successfully.' };
  }

  async rejectCreator(profileId: string, adminUserId: string, reason?: string) {
    const profile = await this.creatorRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator application not found.',
        error: { code: 'APPLICATION_NOT_FOUND' },
      });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        message: 'Application is not pending.',
        error: { code: 'APPLICATION_NOT_PENDING' },
      });
    }

    await this.creatorRepository.rejectApplication(
      profileId,
      adminUserId,
      reason,
    );

    this.logger.log(`Creator ${profileId} rejected by admin ${adminUserId}`);

    return { message: 'Creator application rejected.' };
  }

  private mapProfileToEntity(profile: any): CreatorProfileEntity {
    return {
      id: profile.id,
      userId: profile.user_id,
      displayName: profile.user?.display_name || null,
      username: profile.user?.username || null,
      avatarUrl: profile.user?.avatar_url || null,
      bio: profile.bio || null,
      instagramHandle: profile.instagram_handle || null,
      tiktokHandle: profile.tiktok_handle || null,
      youtubeHandle: profile.youtube_handle || null,
      websiteUrl: profile.website_url || null,
      country: profile.user?.country || null,
      state: profile.user?.state || null,
      city: profile.user?.city || null,
      preferredLanguage: profile.user?.preferred_language || 'en',
      verificationStatus: profile.status,
      kycStatus: profile.kyc?.status || null,
      joinedAt: profile.user?.created_at || profile.created_at,
    };
  }
}
