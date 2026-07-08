import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApprovalStatus, KycStatus, IdType, Prisma } from '@prisma/client';

@Injectable()
export class CreatorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.creatorProfile.findUnique({
      where: { user_id: userId },
      include: {
        kyc: true,
        user: {
          select: {
            display_name: true,
            username: true,
            avatar_url: true,
            country: true,
            state: true,
            city: true,
            preferred_language: true,
            created_at: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.creatorProfile.findUnique({
      where: { id },
      include: {
        kyc: true,
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
            email: true,
            is_active: true,
          },
        },
      },
    });
  }

  async createProfile(
    userId: string,
    data: { bio?: string; instagram_handle?: string; tiktok_handle?: string; youtube_handle?: string; website_url?: string },
  ) {
    return this.prisma.creatorProfile.create({
      data: {
        user_id: userId,
        bio: data.bio,
        instagram_handle: data.instagram_handle,
        tiktok_handle: data.tiktok_handle,
        youtube_handle: data.youtube_handle,
        website_url: data.website_url,
        status: ApprovalStatus.PENDING,
      },
      include: { user: true },
    });
  }

  async createKyc(
    profileId: string,
    data: {
      full_name: string;
      id_type: IdType;
      id_number: string;
      id_front_url: string;
      id_back_url?: string;
      selfie_url: string;
    },
  ) {
    return this.prisma.creatorKyc.create({
      data: {
        creator_profile_id: profileId,
        full_name: data.full_name,
        id_type: data.id_type,
        id_number: data.id_number,
        id_front_url: data.id_front_url,
        id_back_url: data.id_back_url,
        selfie_url: data.selfie_url,
        status: KycStatus.PENDING,
      },
    });
  }

  async updateProfile(id: string, data: Prisma.CreatorProfileUpdateInput) {
    return this.prisma.creatorProfile.update({
      where: { id },
      data,
      include: {
        kyc: true,
        user: {
          select: {
            display_name: true,
            username: true,
            avatar_url: true,
            country: true,
            state: true,
            city: true,
            preferred_language: true,
            created_at: true,
          },
        },
      },
    });
  }

  async findPendingApplications() {
    return this.prisma.creatorProfile.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: {
        kyc: true,
        user: {
          select: {
            id: true,
            display_name: true,
            email: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async updateStatus(id: string, status: ApprovalStatus, rejectedReason?: string) {
    return this.prisma.creatorProfile.update({
      where: { id },
      data: {
        status,
        rejected_reason: rejectedReason,
        is_verified: status === ApprovalStatus.APPROVED,
      },
    });
  }

  async updateKycStatus(profileId: string, status: KycStatus, reviewedBy: string, rejectionReason?: string) {
    return this.prisma.creatorKyc.update({
      where: { creator_profile_id: profileId },
      data: {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_reason: rejectionReason,
      },
    });
  }

  async findVideosByCreatorId(creatorId: string) {
    return this.prisma.video.findMany({
      where: { creator_id: creatorId },
      include: {
        categories: { include: { category: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async countFollowers(userId: string) {
    return this.prisma.follower.count({ where: { following_id: userId } });
  }

  async countVideos(creatorId: string) {
    return this.prisma.video.count({ where: { creator_id: creatorId, deleted_at: null } });
  }
}
