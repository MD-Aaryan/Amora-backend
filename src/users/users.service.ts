import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RoleName } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by their internal UUID, including their assigned roles.
   */
  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
  }

  /**
   * Find a user by their Firebase UID, including their assigned roles.
   */
  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
  }

  /**
   * Create or update a user during Firebase login sync.
   * On first login, assigns the default CUSTOMER role.
   * On subsequent logins, updates profile fields only if changed.
   */
  async upsertByFirebaseUid(data: {
    firebaseUid: string;
    email?: string;
    phone?: string;
    displayName?: string;
    avatarUrl?: string;
  }) {
    const existingUser = await this.findByFirebaseUid(data.firebaseUid);

    if (existingUser) {
      // Update fields that may have changed on the Firebase side
      return this.prisma.user.update({
        where: { firebase_uid: data.firebaseUid },
        data: {
          email: data.email ?? existingUser.email,
          phone: data.phone ?? existingUser.phone,
          display_name: data.displayName ?? existingUser.display_name,
          avatar_url: data.avatarUrl ?? existingUser.avatar_url,
        },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });
    }

    // New user: create with default CUSTOMER role
    const customerRole = await this.prisma.role.findUnique({
      where: { name: RoleName.CUSTOMER },
    });

    if (!customerRole) {
      throw new Error(
        'Default CUSTOMER role not found in database. Please seed the roles table.',
      );
    }

    return this.prisma.user.create({
      data: {
        firebase_uid: data.firebaseUid,
        email: data.email,
        phone: data.phone,
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
        roles: {
          create: {
            role_id: customerRole.id,
          },
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
  }

  /**
   * Extract the list of RoleName strings from a user's role relations.
   */
  extractRoleNames(user: any): RoleName[] {
    if (!user?.roles || !Array.isArray(user.roles)) {
      return [];
    }
    return user.roles.map((ur: any) => ur.role.name as RoleName);
  }
}
