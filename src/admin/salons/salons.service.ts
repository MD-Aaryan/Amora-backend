import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AdminSalonsRepository } from './salons.repository';
import { UsersRepository } from '../../users/users.repository';
import { ApprovalStatus, KycStatus, UserStatus } from '@prisma/client';
import { RoleName } from '../../common/enums/role.enum';

@Injectable()
export class AdminSalonsService {
  private readonly logger = new Logger(AdminSalonsService.name);

  constructor(
    private readonly adminSalonsRepository: AdminSalonsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async listSalons(params: {
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

    const result = await this.adminSalonsRepository.findMany({
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
        name: p.name,
        ownerName: p.user?.display_name || null,
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

  async getSalonById(salonId: string) {
    const profile = await this.adminSalonsRepository.findById(salonId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Salon not found.',
        error: { code: 'SALON_NOT_FOUND' },
      });
    }

    return {
      id: profile.id,
      userId: profile.user_id,
      name: profile.name,
      ownerName: profile.user?.display_name || null,
      username: profile.user?.username || null,
      email: profile.user?.email || null,
      avatarUrl: profile.user?.avatar_url || null,
      country: profile.user?.country || null,
      state: profile.user?.state || null,
      city: profile.user?.city || null,
      preferredLanguage: profile.user?.preferred_language || 'en',
      userStatus: profile.user?.status || null,
      isActive: profile.user?.is_active || false,
      description: profile.description || null,
      address: profile.address,
      phone: profile.phone,
      website: profile.website || null,
      logoUrl: profile.logo_url || null,
      businessHours: profile.business_hours || {},
      isVerified: profile.is_verified,
      profileStatus: profile.status,
      rejectedReason: profile.rejected_reason || null,
      kyc: profile.kyc
        ? {
            id: profile.kyc.id,
            businessName: profile.kyc.business_name,
            registrationNumber: profile.kyc.registration_number,
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

  async approveSalon(salonId: string, adminUserId: string) {
    const profile = await this.adminSalonsRepository.findById(salonId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Salon not found.',
        error: { code: 'SALON_NOT_FOUND' },
      });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        message: 'Salon application is not pending.',
        error: { code: 'NOT_PENDING' },
      });
    }

    await this.adminSalonsRepository.updateStatus(
      salonId,
      ApprovalStatus.APPROVED,
    );
    await this.adminSalonsRepository.updateKycStatus(
      salonId,
      KycStatus.APPROVED,
      adminUserId,
    );

    await this.usersRepository.assignRole(profile.user_id, RoleName.SALON);

    this.logger.log(`Salon ${salonId} approved by admin ${adminUserId}`);

    return { message: 'Salon approved successfully.' };
  }

  async rejectSalon(salonId: string, adminUserId: string, reason?: string) {
    const profile = await this.adminSalonsRepository.findById(salonId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Salon not found.',
        error: { code: 'SALON_NOT_FOUND' },
      });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        message: 'Salon application is not pending.',
        error: { code: 'NOT_PENDING' },
      });
    }

    await this.adminSalonsRepository.updateStatus(
      salonId,
      ApprovalStatus.REJECTED,
      reason,
    );
    await this.adminSalonsRepository.updateKycStatus(
      salonId,
      KycStatus.REJECTED,
      adminUserId,
      reason,
    );

    this.logger.log(`Salon ${salonId} rejected by admin ${adminUserId}`);

    return { message: 'Salon application rejected.' };
  }

  async suspendSalon(salonId: string) {
    const profile = await this.adminSalonsRepository.findById(salonId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Salon not found.',
        error: { code: 'SALON_NOT_FOUND' },
      });
    }

    const user = await this.usersRepository.findById(profile.user_id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'Salon owner not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException({
        success: false,
        message: 'Salon is already suspended.',
        error: { code: 'ALREADY_SUSPENDED' },
      });
    }

    await this.usersRepository.updateProfile(profile.user_id, {
      status: UserStatus.SUSPENDED,
      is_active: false,
    });

    this.logger.log(`Salon ${salonId} suspended by admin`);

    return { message: 'Salon suspended successfully.' };
  }

  async restoreSalon(salonId: string) {
    const profile = await this.adminSalonsRepository.findById(salonId);
    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Salon not found.',
        error: { code: 'SALON_NOT_FOUND' },
      });
    }

    const user = await this.usersRepository.findById(profile.user_id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'Salon owner not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    if (
      user.status === UserStatus.ACTIVE &&
      profile.status !== ApprovalStatus.REJECTED
    ) {
      throw new BadRequestException({
        success: false,
        message: 'Salon is already active.',
        error: { code: 'ALREADY_ACTIVE' },
      });
    }

    if (profile.status === ApprovalStatus.REJECTED) {
      await this.adminSalonsRepository.updateStatus(
        salonId,
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

    this.logger.log(`Salon ${salonId} restored by admin`);

    return { message: 'Salon restored successfully.' };
  }
}
