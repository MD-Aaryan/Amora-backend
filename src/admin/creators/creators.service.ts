import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AdminCreatorsRepository } from './creators.repository';
import { UsersRepository } from '../../users/users.repository';
import { ApprovalStatus, KycStatus, UserStatus } from '@prisma/client';
import { RoleName } from '../../common/enums/role.enum';

@Injectable()
export class AdminCreatorsService {
  private readonly logger = new Logger(AdminCreatorsService.name);

  constructor(
    private readonly adminCreatorsRepository: AdminCreatorsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async listCreators(params: {
    cursor?: string;
    limit?: number;
    status?: string;
    search?: string;
    sort?: string;
  }) {
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const statusMap: Record<string, ApprovalStatus> = {
      pending: ApprovalStatus.PENDING,
      approved: ApprovalStatus.APPROVED,
      rejected: ApprovalStatus.REJECTED,
    };

    const status = params.status
      ? statusMap[params.status.toLowerCase()]
      : undefined;

    const result = await this.adminCreatorsRepository.findMany({
      cursor: params.cursor,
      limit,
      status,
      search: params.search,
      sort: params.sort,
    });

    const profiles = result.profiles as any[];

    return {
      items: profiles.map((p) => ({
        id: p.id,
        userId: p.user_id,
        displayName: p.user?.display_name || null,
        username: p.user?.username || null,
        email: p.user?.email || null,
        avatarUrl: p.user?.avatar_url || null,
        userStatus: p.user?.status || null,
        isActive: p.user?.is_active || false,
        profileStatus: p.status,
        kycStatus: p.kyc?.status || null,
        kycSubmittedAt: p.kyc?.submitted_at || null,
        kycReviewedAt: p.kyc?.reviewed_at || null,
        createdAt: p.created_at,
      })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async getCreatorById(creatorId: string) {
    const profile = await this.adminCreatorsRepository.findById(creatorId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator not found.',
        error: { code: 'CREATOR_NOT_FOUND' },
      });
    }

    return {
      id: profile.id,
      userId: profile.user_id,
      displayName: profile.user?.display_name || null,
      username: profile.user?.username || null,
      email: profile.user?.email || null,
      avatarUrl: profile.user?.avatar_url || null,
      country: profile.user?.country || null,
      state: profile.user?.state || null,
      city: profile.user?.city || null,
      preferredLanguage: profile.user?.preferred_language || 'en',
      userStatus: profile.user?.status || null,
      isActive: profile.user?.is_active || false,
      bio: profile.bio || null,
      instagramHandle: profile.instagram_handle || null,
      tiktokHandle: profile.tiktok_handle || null,
      youtubeHandle: profile.youtube_handle || null,
      websiteUrl: profile.website_url || null,
      profileStatus: profile.status,
      isVerified: profile.is_verified,
      rejectedReason: profile.rejected_reason || null,
      kyc: profile.kyc
        ? {
            id: profile.kyc.id,
            fullName: profile.kyc.full_name,
            idType: profile.kyc.id_type,
            status: profile.kyc.status,
            rejectionReason: profile.kyc.rejection_reason || null,
            submittedAt: profile.kyc.submitted_at,
            reviewedAt: profile.kyc.reviewed_at,
          }
        : null,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async approveCreator(creatorId: string, adminUserId: string) {
    const profile = await this.adminCreatorsRepository.findById(creatorId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator not found.',
        error: { code: 'CREATOR_NOT_FOUND' },
      });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        message: 'Creator application is not pending.',
        error: { code: 'NOT_PENDING' },
      });
    }

    await this.adminCreatorsRepository.updateStatus(
      creatorId,
      ApprovalStatus.APPROVED,
    );
    await this.adminCreatorsRepository.updateKycStatus(
      creatorId,
      KycStatus.APPROVED,
      adminUserId,
    );

    await this.usersRepository.assignRole(profile.user_id, RoleName.CREATOR);

    this.logger.log(`Creator ${creatorId} approved by admin ${adminUserId}`);

    return { message: 'Creator approved successfully.' };
  }

  async rejectCreator(creatorId: string, adminUserId: string, reason?: string) {
    const profile = await this.adminCreatorsRepository.findById(creatorId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator not found.',
        error: { code: 'CREATOR_NOT_FOUND' },
      });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        message: 'Creator application is not pending.',
        error: { code: 'NOT_PENDING' },
      });
    }

    await this.adminCreatorsRepository.updateStatus(
      creatorId,
      ApprovalStatus.REJECTED,
      reason,
    );
    await this.adminCreatorsRepository.updateKycStatus(
      creatorId,
      KycStatus.REJECTED,
      adminUserId,
      reason,
    );

    this.logger.log(`Creator ${creatorId} rejected by admin ${adminUserId}`);

    return { message: 'Creator application rejected.' };
  }

  async suspendCreator(creatorId: string) {
    const profile = await this.adminCreatorsRepository.findById(creatorId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator not found.',
        error: { code: 'CREATOR_NOT_FOUND' },
      });
    }

    const user = await this.usersRepository.findById(profile.user_id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'Creator user not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException({
        success: false,
        message: 'Creator is already suspended.',
        error: { code: 'ALREADY_SUSPENDED' },
      });
    }

    await this.usersRepository.updateProfile(profile.user_id, {
      status: UserStatus.SUSPENDED,
      is_active: false,
    });

    this.logger.log(`Creator ${creatorId} suspended by admin`);

    return { message: 'Creator suspended successfully.' };
  }

  async restoreCreator(creatorId: string) {
    const profile = await this.adminCreatorsRepository.findById(creatorId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Creator not found.',
        error: { code: 'CREATOR_NOT_FOUND' },
      });
    }

    const user = await this.usersRepository.findById(profile.user_id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'Creator user not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    if (
      user.status === UserStatus.ACTIVE &&
      profile.status !== ApprovalStatus.REJECTED
    ) {
      throw new BadRequestException({
        success: false,
        message: 'Creator is already active.',
        error: { code: 'ALREADY_ACTIVE' },
      });
    }

    if (profile.status === ApprovalStatus.REJECTED) {
      await this.adminCreatorsRepository.updateStatus(
        creatorId,
        ApprovalStatus.PENDING,
        undefined,
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      await this.usersRepository.updateProfile(profile.user_id, {
        status: UserStatus.ACTIVE,
        is_active: true,
      });
    }

    this.logger.log(`Creator ${creatorId} restored by admin`);

    return { message: 'Creator restored successfully.' };
  }
}
