import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AdminReportsRepository } from './reports.repository';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class AdminReportsService {
  private readonly logger = new Logger(AdminReportsService.name);

  constructor(
    private readonly adminReportsRepository: AdminReportsRepository,
  ) {}

  async listReports(params: {
    cursor?: string;
    limit?: number;
    status?: string;
    reason?: string;
    sort?: string;
  }) {
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const statusEnum = params.status
      ? ReportStatus[params.status.toUpperCase() as keyof typeof ReportStatus]
      : undefined;

    const result = await this.adminReportsRepository.findMany({
      cursor: params.cursor,
      limit,
      status: statusEnum,
      reason: params.reason,
      sort: params.sort,
    });

    const reports = result.reports as any[];

    return {
      items: reports.map((r) => ({
        id: r.id,
        reporter: r.reporter
          ? {
              id: r.reporter.id,
              displayName: r.reporter.display_name,
              username: r.reporter.username,
              avatarUrl: r.reporter.avatar_url,
            }
          : null,
        reportedUser: r.reported_user
          ? {
              id: r.reported_user.id,
              displayName: r.reported_user.display_name,
              username: r.reported_user.username,
            }
          : null,
        reportedVideo: r.reported_video
          ? {
              id: r.reported_video.id,
              title: r.reported_video.title,
              thumbnailUrl: r.reported_video.thumbnail_url,
            }
          : null,
        reportedComment: r.reported_comment
          ? {
              id: r.reported_comment.id,
              content: r.reported_comment.content?.substring(0, 100),
            }
          : null,
        reason: r.reason,
        details: r.details || null,
        status: r.status,
        resolver: r.resolver
          ? { id: r.resolver.id, displayName: r.resolver.display_name }
          : null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async getReportById(reportId: string) {
    const report = (await this.adminReportsRepository.findById(
      reportId,
    )) as any;
    if (!report) {
      throw new NotFoundException({
        success: false,
        message: 'Report not found.',
        error: { code: 'REPORT_NOT_FOUND' },
      });
    }

    return {
      id: report.id,
      reporter: report.reporter
        ? {
            id: report.reporter.id,
            displayName: report.reporter.display_name,
            username: report.reporter.username,
            avatarUrl: report.reporter.avatar_url,
            email: report.reporter.email,
          }
        : null,
      reportedUser: report.reported_user
        ? {
            id: report.reported_user.id,
            displayName: report.reported_user.display_name,
            username: report.reported_user.username,
            email: report.reported_user.email,
          }
        : null,
      reportedVideo: report.reported_video
        ? {
            id: report.reported_video.id,
            title: report.reported_video.title,
            thumbnailUrl: report.reported_video.thumbnail_url,
            videoUrl: report.reported_video.video_url,
            status: report.reported_video.status,
            creatorName:
              report.reported_video.creator?.user?.display_name || null,
          }
        : null,
      reportedComment: report.reported_comment
        ? {
            id: report.reported_comment.id,
            content: report.reported_comment.content,
            authorName: report.reported_comment.user?.display_name || null,
          }
        : null,
      reason: report.reason,
      details: report.details || null,
      status: report.status,
      resolution: report.resolution || null,
      resolver: report.resolver
        ? { id: report.resolver.id, displayName: report.resolver.display_name }
        : null,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };
  }

  async reviewReport(reportId: string, adminUserId: string) {
    const report = await this.adminReportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException({
        success: false,
        message: 'Report not found.',
        error: { code: 'REPORT_NOT_FOUND' },
      });
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        message: 'Report is not pending review.',
        error: { code: 'NOT_PENDING' },
      });
    }

    const updated = await this.adminReportsRepository.updateStatus(
      reportId,
      ReportStatus.UNDER_REVIEW,
      adminUserId,
    );

    this.logger.log(
      `Report ${reportId} moved to under review by admin ${adminUserId}`,
    );

    return {
      id: updated.id,
      status: updated.status,
      message: 'Report is now under review.',
    };
  }

  async resolveReport(reportId: string, adminUserId: string, notes?: string) {
    const report = await this.adminReportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException({
        success: false,
        message: 'Report not found.',
        error: { code: 'REPORT_NOT_FOUND' },
      });
    }

    if (report.status === ReportStatus.RESOLVED) {
      throw new BadRequestException({
        success: false,
        message: 'Report is already resolved.',
        error: { code: 'ALREADY_RESOLVED' },
      });
    }

    const updated = await this.adminReportsRepository.updateStatus(
      reportId,
      ReportStatus.RESOLVED,
      adminUserId,
      notes,
    );

    this.logger.log(`Report ${reportId} resolved by admin ${adminUserId}`);

    return {
      id: updated.id,
      status: updated.status,
      message: 'Report resolved successfully.',
    };
  }

  async dismissReport(reportId: string, adminUserId: string, notes?: string) {
    const report = await this.adminReportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException({
        success: false,
        message: 'Report not found.',
        error: { code: 'REPORT_NOT_FOUND' },
      });
    }

    if (report.status === ReportStatus.DISMISSED) {
      throw new BadRequestException({
        success: false,
        message: 'Report is already dismissed.',
        error: { code: 'ALREADY_DISMISSED' },
      });
    }

    const updated = await this.adminReportsRepository.updateStatus(
      reportId,
      ReportStatus.DISMISSED,
      adminUserId,
      notes,
    );

    this.logger.log(`Report ${reportId} dismissed by admin ${adminUserId}`);

    return {
      id: updated.id,
      status: updated.status,
      message: 'Report dismissed.',
    };
  }
}
