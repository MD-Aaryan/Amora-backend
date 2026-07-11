import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserStatus, ApprovalStatus, VideoStatus } from '@prisma/client';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countTotalUsers() {
    return this.prisma.user.count({ where: { deleted_at: null } });
  }

  async countActiveUsers() {
    return this.prisma.user.count({
      where: { status: UserStatus.ACTIVE, deleted_at: null },
    });
  }

  async countSuspendedUsers() {
    return this.prisma.user.count({
      where: { status: UserStatus.SUSPENDED, deleted_at: null },
    });
  }

  async countDeletedUsers() {
    return this.prisma.user.count({
      where: { deleted_at: { not: null } },
    });
  }

  async countBlockedUsers() {
    return this.prisma.user.count({
      where: { status: UserStatus.BLOCKED, deleted_at: null },
    });
  }

  async countTotalCreators() {
    return this.prisma.creatorProfile.count({ where: { deleted_at: null } });
  }

  async countApprovedCreators() {
    return this.prisma.creatorProfile.count({
      where: { status: ApprovalStatus.APPROVED, deleted_at: null },
    });
  }

  async countPendingCreators() {
    return this.prisma.creatorProfile.count({
      where: { status: ApprovalStatus.PENDING, deleted_at: null },
    });
  }

  async countRejectedCreators() {
    return this.prisma.creatorProfile.count({
      where: { status: ApprovalStatus.REJECTED, deleted_at: null },
    });
  }

  async countTotalSalons() {
    return this.prisma.salonProfile.count({ where: { deleted_at: null } });
  }

  async countApprovedSalons() {
    return this.prisma.salonProfile.count({
      where: { status: ApprovalStatus.APPROVED, deleted_at: null },
    });
  }

  async countPendingSalons() {
    return this.prisma.salonProfile.count({
      where: { status: ApprovalStatus.PENDING, deleted_at: null },
    });
  }

  async countRejectedSalons() {
    return this.prisma.salonProfile.count({
      where: { status: ApprovalStatus.REJECTED, deleted_at: null },
    });
  }

  async countTotalVideos() {
    return this.prisma.video.count({ where: { deleted_at: null } });
  }

  async countPublishedVideos() {
    return this.prisma.video.count({
      where: { status: VideoStatus.ACTIVE, deleted_at: null },
    });
  }

  async countDraftVideos() {
    return this.prisma.video.count({
      where: { status: VideoStatus.DRAFT, deleted_at: null },
    });
  }

  async countHiddenVideos() {
    return this.prisma.video.count({
      where: { status: VideoStatus.BLOCKED, deleted_at: null },
    });
  }

  async getRecentUsers(limit: number) {
    return this.prisma.user.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        display_name: true,
        username: true,
        email: true,
        avatar_url: true,
        status: true,
        is_active: true,
        created_at: true,
        roles: {
          include: {
            role: { select: { name: true } },
          },
        },
      },
    });
  }

  async getRecentCreatorApplications(limit: number) {
    return this.prisma.creatorProfile.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async getRecentSalonApplications(limit: number) {
    return this.prisma.salonProfile.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async getRecentUploadedVideos(limit: number) {
    return this.prisma.video.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        thumbnail_url: true,
        duration: true,
        views_count: true,
        status: true,
        created_at: true,
        creator: {
          select: {
            user: { select: { display_name: true } },
          },
        },
        salon: {
          select: { name: true },
        },
      },
    });
  }
}
