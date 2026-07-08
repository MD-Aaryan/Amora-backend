import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RoleName } from '../common/enums/role.enum';
import { Prisma, UserStatus, VideoStatus } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private userInclude = {
    roles: { include: { role: true } },
  } as const;

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude,
    });
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
      include: this.userInclude,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.userInclude,
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: this.userInclude,
    });
  }

  async upsertByFirebaseUid(data: {
    firebaseUid: string;
    email?: string;
    phone?: string;
    displayName?: string;
    avatarUrl?: string;
    extraRoles?: string[];
  }) {
    const existingUser = await this.findByFirebaseUid(data.firebaseUid);

    if (existingUser) {
      return this.prisma.user.update({
        where: { firebase_uid: data.firebaseUid },
        data: {
          email: data.email ?? existingUser.email,
          phone: data.phone ?? existingUser.phone,
          display_name: existingUser.display_name ?? data.displayName,
          avatar_url: data.avatarUrl ?? existingUser.avatar_url,
        },
        include: this.userInclude,
      });
    }

    if (data.email) {
      const existingByEmail = await this.findByEmail(data.email);
      if (existingByEmail) {
        return this.prisma.user.update({
          where: { email: data.email },
          data: {
            firebase_uid: data.firebaseUid,
            phone: data.phone ?? existingByEmail.phone,
            display_name: existingByEmail.display_name ?? data.displayName,
            avatar_url: data.avatarUrl ?? existingByEmail.avatar_url,
          },
          include: this.userInclude,
        });
      }
    }

    const customerRole = await this.prisma.role.findUnique({
      where: { name: RoleName.CUSTOMER },
    });

    if (!customerRole) {
      throw new Error('Default CUSTOMER role not found in database. Please seed the roles table.');
    }

    const roleConnections: { role_id: string }[] = [{ role_id: customerRole.id }];

    if (data.extraRoles && data.extraRoles.length > 0) {
      for (const roleName of data.extraRoles) {
        const role = await this.prisma.role.findUnique({ where: { name: roleName as RoleName } });
        if (role) {
          roleConnections.push({ role_id: role.id });
        }
      }
    }

    return this.prisma.user.create({
      data: {
        firebase_uid: data.firebaseUid,
        email: data.email,
        phone: data.phone,
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
        roles: { create: roleConnections },
      },
      include: this.userInclude,
    });
  }

  async updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: this.userInclude,
    });
  }

  async softDelete(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        is_active: false,
        deleted_at: new Date(),
      },
    });
  }

  async hardDelete(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  async assignRole(userId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName as RoleName } });
    if (!role) return null;

    await this.prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: userId, role_id: role.id } },
      create: { user_id: userId, role_id: role.id },
      update: {},
    });

    return this.findById(userId);
  }

  extractRoleNames(user: any): RoleName[] {
    if (!user?.roles || !Array.isArray(user.roles)) return [];
    return user.roles.map((ur: any) => ur.role.name as RoleName);
  }

  async getSavedVideos(userId: string) {
    return this.prisma.savedVideo.findMany({
      where: { user_id: userId },
      include: {
        video: {
          include: {
            creator: { include: { user: true } },
            categories: { include: { category: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async saveVideo(userId: string, videoId: string) {
    return this.prisma.savedVideo.upsert({
      where: { user_id_video_id: { user_id: userId, video_id: videoId } },
      create: { user_id: userId, video_id: videoId },
      update: {},
    });
  }

  async unsaveVideo(userId: string, videoId: string) {
    return this.prisma.savedVideo.delete({
      where: { user_id_video_id: { user_id: userId, video_id: videoId } },
    });
  }

  async getWatchHistory(userId: string) {
    return this.prisma.watchHistory.findMany({
      where: { user_id: userId },
      include: {
        video: {
          include: {
            creator: { include: { user: true } },
          },
        },
      },
      orderBy: { watched_at: 'desc' },
      take: 50,
    });
  }

  async upsertWatchHistory(userId: string, videoId: string, lastPosition: number, completed: boolean) {
    return this.prisma.watchHistory.upsert({
      where: { user_id_video_id: { user_id: userId, video_id: videoId } },
      create: { user_id: userId, video_id: videoId, last_position: lastPosition, completed },
      update: { last_position: lastPosition, completed, watched_at: new Date() },
    });
  }

  async clearWatchHistory(userId: string) {
    return this.prisma.watchHistory.deleteMany({ where: { user_id: userId } });
  }

  async getLikedVideos(userId: string) {
    return this.prisma.videoLike.findMany({
      where: { user_id: userId },
      include: {
        video: {
          include: {
            creator: { include: { user: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follower.findMany({
      where: { follower_id: userId },
      include: {
        following: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
            bio: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async follow(followerId: string, followingId: string) {
    return this.prisma.follower.upsert({
      where: { follower_id_following_id: { follower_id: followerId, following_id: followingId } },
      create: { follower_id: followerId, following_id: followingId },
      update: {},
    });
  }

  async unfollow(followerId: string, followingId: string) {
    return this.prisma.follower.delete({
      where: { follower_id_following_id: { follower_id: followerId, following_id: followingId } },
    });
  }

  async getFollowerCount(userId: string) {
    return this.prisma.follower.count({ where: { following_id: userId } });
  }

  async getFollowingCount(userId: string) {
    return this.prisma.follower.count({ where: { follower_id: userId } });
  }

  async getLatestVideos(take = 20) {
    return this.prisma.video.findMany({
      where: { status: VideoStatus.ACTIVE },
      include: {
        creator: { include: { user: true } },
        categories: { include: { category: true } },
      },
      orderBy: { created_at: 'desc' },
      take,
    });
  }

  async getTrendingVideos(take = 20) {
    return this.prisma.video.findMany({
      where: { status: VideoStatus.ACTIVE },
      include: {
        creator: { include: { user: true } },
        categories: { include: { category: true } },
      },
      orderBy: { views_count: 'desc' },
      take,
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { parent_id: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

}
