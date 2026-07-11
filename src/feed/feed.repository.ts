import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApprovalStatus, VideoStatus, VideoVisibility } from '@prisma/client';
import { FeedCursor } from './interfaces';

@Injectable()
export class FeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  private feedInclude = {
    categories: { include: { category: true } },
    tags: { include: { tag: true } },
    creator: {
      include: {
        user: { select: { display_name: true, avatar_url: true } },
      },
    },
  } as const;

  private baseWhere() {
    return {
      visibility: VideoVisibility.PUBLIC,
      status: VideoStatus.ACTIVE,
      deleted_at: null,
    };
  }

  private partnerWhere() {
    return {
      OR: [
        { creator: { status: ApprovalStatus.APPROVED } },
        { salon: { status: ApprovalStatus.APPROVED } },
      ],
    };
  }

  private cursorWhere(cursor: FeedCursor): any {
    return {
      OR: [
        { created_at: { lt: cursor.createdAt } },
        { created_at: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }

  async findFeed(cursor?: FeedCursor, limit = 20) {
    const where: any = {
      ...this.baseWhere(),
      AND: [this.partnerWhere()],
    };

    if (cursor) {
      where.AND.push(this.cursorWhere(cursor));
    }

    return this.prisma.video.findMany({
      where,
      include: this.feedInclude,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
  }

  async findByCategory(categoryId: string, cursor?: FeedCursor, limit = 20) {
    const where: any = {
      ...this.baseWhere(),
      categories: { some: { category_id: categoryId } },
      AND: [this.partnerWhere()],
    };

    if (cursor) {
      where.AND.push(this.cursorWhere(cursor));
    }

    return this.prisma.video.findMany({
      where,
      include: this.feedInclude,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
  }

  async findByCreator(creatorId: string, cursor?: FeedCursor, limit = 20) {
    const where: any = {
      ...this.baseWhere(),
      creator_id: creatorId,
      creator: { status: ApprovalStatus.APPROVED },
    };

    if (cursor) {
      const ORs: any[] = [
        { created_at: { lt: cursor.createdAt } },
        { created_at: cursor.createdAt, id: { lt: cursor.id } },
      ];
      if (!where.AND) {
        where.AND = [];
      }
      where.AND.push({ OR: ORs });
    }

    return this.prisma.video.findMany({
      where,
      include: this.feedInclude,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
  }

  async findBySalon(salonId: string, cursor?: FeedCursor, limit = 20) {
    const where: any = {
      ...this.baseWhere(),
      salon_id: salonId,
      salon: { status: ApprovalStatus.APPROVED },
    };

    if (cursor) {
      const ORs: any[] = [
        { created_at: { lt: cursor.createdAt } },
        { created_at: cursor.createdAt, id: { lt: cursor.id } },
      ];
      if (!where.AND) {
        where.AND = [];
      }
      where.AND.push({ OR: ORs });
    }

    return this.prisma.video.findMany({
      where,
      include: this.feedInclude,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
  }
}
