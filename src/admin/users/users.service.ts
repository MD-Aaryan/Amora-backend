import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AdminUsersRepository } from './users.repository';
import { UsersRepository } from '../../users/users.repository';
import { AdminUserStatusAction } from '../dto/update-user-status.dto';
import { UserStatus, RoleName } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly adminUsersRepository: AdminUsersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async listUsers(params: {
    cursor?: string;
    limit?: number;
    status?: string;
    role?: string;
    country?: string;
    language?: string;
    search?: string;
    sort?: string;
  }) {
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const statusMap: Record<string, UserStatus> = {
      active: UserStatus.ACTIVE,
      pending: UserStatus.PENDING,
      blocked: UserStatus.BLOCKED,
      suspended: UserStatus.SUSPENDED,
      deleted: UserStatus.DELETED,
    };

    const status = params.status
      ? statusMap[params.status.toLowerCase()]
      : undefined;

    const roleValue = params.role
      ? (Object.values(RoleName) as string[]).includes(
          params.role.toUpperCase(),
        )
        ? (params.role.toUpperCase() as RoleName)
        : undefined
      : undefined;
    const result = await this.adminUsersRepository.findMany({
      cursor: params.cursor,
      limit,
      status,
      role: roleValue,
      country: params.country,
      language: params.language,
      search: params.search,
      sort: params.sort,
    });

    const users = result.users as any[];

    return {
      items: users.map((u) => ({
        id: u.id,
        displayName: u.display_name,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatar_url,
        country: u.country,
        state: u.state,
        city: u.city,
        preferredLanguage: u.preferred_language,
        status: u.status,
        isActive: u.is_active,
        roles: u.roles.map((r: any) => r.role.name),
        createdAt: u.created_at,
      })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async getUserById(userId: string) {
    const user = await this.adminUsersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      username: user.username,
      avatarUrl: user.avatar_url,
      country: user.country,
      state: user.state,
      city: user.city,
      preferredLanguage: user.preferred_language,
      status: user.status,
      isActive: user.is_active,
      roles: user.roles.map((r) => r.role.name),
      creatorProfile: user.creator_profile || null,
      salonProfiles: user.salon_profiles || [],
      createdAt: user.created_at,
    };
  }

  async updateUserStatus(userId: string, action: AdminUserStatusAction) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    const isTargetAdmin = user.roles?.some(
      (r: any) => r.role?.name === RoleName.ADMIN,
    );
    if (isTargetAdmin) {
      throw new ForbiddenException({
        success: false,
        message: 'Cannot modify another administrator account.',
        error: { code: 'ADMIN_TARGET_NOT_ALLOWED' },
      });
    }

    if (user.deleted_at) {
      throw new BadRequestException({
        success: false,
        message: 'Cannot modify a deleted user. Use restore first.',
        error: { code: 'USER_DELETED' },
      });
    }

    const statusMap: Record<AdminUserStatusAction, UserStatus> = {
      [AdminUserStatusAction.ACTIVATE]: UserStatus.ACTIVE,
      [AdminUserStatusAction.SUSPEND]: UserStatus.SUSPENDED,
      [AdminUserStatusAction.BLOCK]: UserStatus.BLOCKED,
      [AdminUserStatusAction.DELETE]: UserStatus.DELETED,
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid status action.',
        error: { code: 'INVALID_ACTION' },
      });
    }

    const updated = await this.adminUsersRepository.updateStatus(
      userId,
      newStatus,
    );
    this.logger.log(`User ${userId} status changed to ${newStatus}`);

    return {
      id: updated.id,
      displayName: updated.display_name,
      status: updated.status,
      isActive: updated.is_active,
      message: `User ${action}d successfully.`,
    };
  }

  async restoreUser(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found.',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    const isTargetAdmin = user.roles?.some(
      (r: any) => r.role?.name === RoleName.ADMIN,
    );
    if (isTargetAdmin) {
      throw new ForbiddenException({
        success: false,
        message: 'Cannot modify another administrator account.',
        error: { code: 'ADMIN_TARGET_NOT_ALLOWED' },
      });
    }

    if (!user.deleted_at) {
      throw new BadRequestException({
        success: false,
        message: 'User is not deleted.',
        error: { code: 'USER_NOT_DELETED' },
      });
    }

    const updated = await this.adminUsersRepository.restore(userId);
    this.logger.log(`User ${userId} restored`);

    return {
      id: updated.id,
      displayName: updated.display_name,
      status: updated.status,
      isActive: updated.is_active,
      message: 'User restored successfully.',
    };
  }
}
