import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── Profile ─────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }

    const roleNames = this.usersRepository.extractRoleNames(user);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.display_name,
      username: user.username,
      bio: user.bio,
      gender: user.gender,
      dateOfBirth: user.date_of_birth,
      country: user.country,
      state: user.state,
      city: user.city,
      preferredLanguage: user.preferred_language,
      avatarUrl: user.avatar_url,
      status: user.status,
      isActive: user.is_active,
      roles: roleNames,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.usersRepository.findByUsername(dto.username);
      if (existing && existing.id !== userId) {
        throw new ConflictException({ success: false, message: 'Username already taken.', error: { code: 'USERNAME_EXISTS' } });
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.display_name !== undefined) data.display_name = dto.display_name?.toString().trim();
    if (dto.username !== undefined) data.username = dto.username?.toString().trim().toLowerCase();
    if (dto.bio !== undefined) data.bio = dto.bio?.toString().trim();
    if (dto.gender !== undefined) data.gender = dto.gender?.toString().trim();
    if (dto.date_of_birth !== undefined) {
      const parsed = new Date(dto.date_of_birth);
      if (!isNaN(parsed.getTime())) {
        data.date_of_birth = parsed;
      }
    }
    if (dto.country !== undefined) data.country = dto.country?.toString().trim();
    if (dto.state !== undefined) data.state = dto.state?.toString().trim();
    if (dto.city !== undefined) data.city = dto.city?.toString().trim();
    if (dto.preferred_language !== undefined) data.preferred_language = dto.preferred_language?.toString().trim();

    const user = await this.usersRepository.updateProfile(userId, data);
    return this.getProfile(user.id);
  }

  async getPublicProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.status === UserStatus.DELETED) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }

    const roleNames = this.usersRepository.extractRoleNames(user);
    const followerCount = await this.usersRepository.getFollowerCount(userId);
    const followingCount = await this.usersRepository.getFollowingCount(userId);

    return {
      id: user.id,
      displayName: user.display_name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      followerCount,
      followingCount,
      isCreator: roleNames.includes('CREATOR' as any),
      isSalon: roleNames.includes('SALON' as any),
    };
  }

  async getPublicProfileByUsername(username: string) {
    const user = await this.usersRepository.findByUsername(username);
    if (!user || user.status === UserStatus.DELETED) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }
    return this.getPublicProfile(user.id);
  }

  async deleteAccount(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }
    await this.usersRepository.softDelete(userId);
    this.logger.log(`User ${userId} account deactivated`);
  }

  // ─── Avatar ──────────────────────────────────────────────────────

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({ success: false, message: 'No file provided.', error: { code: 'FILE_REQUIRED' } });
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }

    if (user.avatar_url) {
      await this.cloudinaryService.deleteImage(user.avatar_url).catch(() => {});
    }

    const url = await this.cloudinaryService.uploadImage(file);
    await this.usersRepository.updateProfile(userId, { avatar_url: url });

    return { avatarUrl: url };
  }

  async deleteAvatar(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }

    if (user.avatar_url) {
      await this.cloudinaryService.deleteImage(user.avatar_url).catch(() => {});
    }

    await this.usersRepository.updateProfile(userId, { avatar_url: null });
  }

  // ─── Saved Videos ────────────────────────────────────────────────

  async getSavedVideos(userId: string) {
    const items = await this.usersRepository.getSavedVideos(userId);
    return items.map((item) => ({
      id: item.video.id,
      title: item.video.title,
      thumbnailUrl: item.video.thumbnail_url,
      duration: item.video.duration,
      viewsCount: item.video.views_count,
      creatorName: item.video.creator?.user?.display_name,
      savedAt: item.created_at,
    }));
  }

  async saveVideo(userId: string, videoId: string) {
    try {
      await this.usersRepository.saveVideo(userId, videoId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException({ success: false, message: 'Video not found.', error: { code: 'VIDEO_NOT_FOUND' } });
      }
      throw error;
    }
    return { message: 'Video saved.' };
  }

  async unsaveVideo(userId: string, videoId: string) {
    try {
      await this.usersRepository.unsaveVideo(userId, videoId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException({ success: false, message: 'Video not found in saved list.', error: { code: 'SAVED_VIDEO_NOT_FOUND' } });
      }
      throw error;
    }
  }

  // ─── Watch History ───────────────────────────────────────────────

  async getWatchHistory(userId: string) {
    const items = await this.usersRepository.getWatchHistory(userId);
    return items.map((item) => ({
      id: item.video.id,
      title: item.video.title,
      thumbnailUrl: item.video.thumbnail_url,
      duration: item.video.duration,
      lastPosition: item.last_position,
      completed: item.completed,
      watchedAt: item.watched_at,
    }));
  }

  async recordWatch(userId: string, videoId: string, lastPosition = 0, completed = false) {
    try {
      await this.usersRepository.upsertWatchHistory(userId, videoId, lastPosition, completed);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException({ success: false, message: 'Video not found.', error: { code: 'VIDEO_NOT_FOUND' } });
      }
      throw error;
    }
    return { message: 'Watch recorded.' };
  }

  async clearWatchHistory(userId: string) {
    await this.usersRepository.clearWatchHistory(userId);
  }

  // ─── Liked Videos ────────────────────────────────────────────────

  async getLikedVideos(userId: string) {
    const items = await this.usersRepository.getLikedVideos(userId);
    return items.map((item) => ({
      id: item.video.id,
      title: item.video.title,
      thumbnailUrl: item.video.thumbnail_url,
      duration: item.video.duration,
      likesCount: item.video.likes_count,
      likedAt: item.created_at,
    }));
  }

  // ─── Following ───────────────────────────────────────────────────

  async getFollowing(userId: string) {
    const items = await this.usersRepository.getFollowing(userId);
    return items.map((item) => ({
      id: item.following.id,
      displayName: item.following.display_name,
      username: item.following.username,
      avatarUrl: item.following.avatar_url,
      bio: item.following.bio,
      followedAt: item.created_at,
    }));
  }

  async follow(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException({ success: false, message: 'Cannot follow yourself.', error: { code: 'SELF_FOLLOW' } });
    }

    const target = await this.usersRepository.findById(targetUserId);
    if (!target) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }

    try {
      await this.usersRepository.follow(userId, targetUserId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException({ success: false, message: 'Target user not found.', error: { code: 'USER_NOT_FOUND' } });
      }
      throw error;
    }
    return { message: 'Followed successfully.' };
  }

  async unfollow(userId: string, targetUserId: string) {
    try {
      await this.usersRepository.unfollow(userId, targetUserId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException({ success: false, message: 'Not following this user.', error: { code: 'FOLLOW_NOT_FOUND' } });
      }
      throw error;
    }
  }

  // ─── Dashboard ───────────────────────────────────────────────────

  async getHomeFeed(userId: string, options?: { page?: number; limit?: number }) {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    const [videos, history] = await Promise.all([
      this.usersRepository.getLatestVideos(limit + skip),
      this.usersRepository.getWatchHistory(userId),
    ]);

    const items = videos.slice(skip, skip + limit).map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnail_url,
      duration: v.duration,
      viewsCount: v.views_count,
      likesCount: v.likes_count,
      creatorName: v.creator?.user?.display_name,
      creatorAvatar: v.creator?.user?.avatar_url,
      categories: v.categories?.map((c) => c.category.name),
      createdAt: v.created_at,
    }));

    return { items, page, limit, total: videos.length };
  }

  async getRecommendedVideos(userId: string) {
    const latest = await this.usersRepository.getLatestVideos(10);
    return latest.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnail_url,
      duration: v.duration,
      viewsCount: v.views_count,
      creatorName: v.creator?.user?.display_name,
    }));
  }

  async getTrendingVideos() {
    const items = await this.usersRepository.getTrendingVideos(20);
    return items.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnail_url,
      duration: v.duration,
      viewsCount: v.views_count,
      likesCount: v.likes_count,
      creatorName: v.creator?.user?.display_name,
    }));
  }

  async getCategories() {
    return this.usersRepository.getCategories();
  }

  // ─── Auth Module Compatibility ───────────────────────────────────

  async findById(userId: string) {
    return this.usersRepository.findById(userId);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.usersRepository.findByFirebaseUid(firebaseUid);
  }

  async upsertByFirebaseUid(data: {
    firebaseUid: string; email?: string; phone?: string;
    displayName?: string; avatarUrl?: string; extraRoles?: string[];
  }) {
    return this.usersRepository.upsertByFirebaseUid(data);
  }

  extractRoleNames(user: any) {
    return this.usersRepository.extractRoleNames(user);
  }

  async deleteById(userId: string) {
    return this.usersRepository.hardDelete(userId);
  }

  async softDeleteById(userId: string) {
    return this.usersRepository.softDelete(userId);
  }

  async assignRole(userId: string, roleName: string) {
    return this.usersRepository.assignRole(userId, roleName);
  }

}
