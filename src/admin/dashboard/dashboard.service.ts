import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getDashboardOverview() {
    const [
      totalUsers,
      totalCreators,
      totalSalons,
      totalVideos,
      pendingCreatorRequests,
      pendingSalonRequests,
      publishedVideos,
      hiddenVideos,
      blockedUsers,
      recentUsers,
      recentCreatorApplications,
      recentSalonApplications,
      recentUploadedVideos,
    ] = await Promise.all([
      this.dashboardRepository.countTotalUsers(),
      this.dashboardRepository.countTotalCreators(),
      this.dashboardRepository.countTotalSalons(),
      this.dashboardRepository.countTotalVideos(),
      this.dashboardRepository.countPendingCreators(),
      this.dashboardRepository.countPendingSalons(),
      this.dashboardRepository.countPublishedVideos(),
      this.dashboardRepository.countHiddenVideos(),
      this.dashboardRepository.countBlockedUsers(),
      this.dashboardRepository.getRecentUsers(10),
      this.dashboardRepository.getRecentCreatorApplications(10),
      this.dashboardRepository.getRecentSalonApplications(10),
      this.dashboardRepository.getRecentUploadedVideos(10),
    ]);

    return {
      totalUsers,
      totalCreators,
      totalSalons,
      totalVideos,
      pendingCreatorRequests,
      pendingSalonRequests,
      publishedVideos,
      hiddenVideos,
      blockedUsers,
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        displayName: u.display_name,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatar_url,
        status: u.status,
        isActive: u.is_active,
        roles: u.roles.map((r) => r.role.name),
        createdAt: u.created_at,
      })),
      recentCreatorApplications: recentCreatorApplications.map((c) => ({
        id: c.id,
        userId: c.user_id,
        displayName: c.user?.display_name || null,
        username: c.user?.username || null,
        avatarUrl: c.user?.avatar_url || null,
        status: c.status,
        createdAt: c.created_at,
      })),
      recentSalonApplications: recentSalonApplications.map((s) => ({
        id: s.id,
        userId: s.user_id,
        displayName: s.user?.display_name || null,
        username: s.user?.username || null,
        avatarUrl: s.user?.avatar_url || null,
        status: s.status,
        createdAt: s.created_at,
      })),
      recentUploadedVideos: recentUploadedVideos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnail_url,
        duration: v.duration,
        viewsCount: v.views_count,
        status: v.status,
        creatorName: v.creator?.user?.display_name || null,
        salonName: v.salon?.name || null,
        createdAt: v.created_at,
      })),
    };
  }

  async getStatistics() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      totalCreators,
      approvedCreators,
      pendingCreators,
      rejectedCreators,
      totalSalons,
      approvedSalons,
      pendingSalons,
      rejectedSalons,
      totalVideos,
      publishedVideos,
      draftVideos,
      hiddenVideos,
    ] = await Promise.all([
      this.dashboardRepository.countTotalUsers(),
      this.dashboardRepository.countActiveUsers(),
      this.dashboardRepository.countSuspendedUsers(),
      this.dashboardRepository.countDeletedUsers(),
      this.dashboardRepository.countTotalCreators(),
      this.dashboardRepository.countApprovedCreators(),
      this.dashboardRepository.countPendingCreators(),
      this.dashboardRepository.countRejectedCreators(),
      this.dashboardRepository.countTotalSalons(),
      this.dashboardRepository.countApprovedSalons(),
      this.dashboardRepository.countPendingSalons(),
      this.dashboardRepository.countRejectedSalons(),
      this.dashboardRepository.countTotalVideos(),
      this.dashboardRepository.countPublishedVideos(),
      this.dashboardRepository.countDraftVideos(),
      this.dashboardRepository.countHiddenVideos(),
    ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      totalCreators,
      approvedCreators,
      pendingCreators,
      rejectedCreators,
      totalSalons,
      approvedSalons,
      pendingSalons,
      rejectedSalons,
      totalVideos,
      publishedVideos,
      draftVideos,
      hiddenVideos,
    };
  }
}
