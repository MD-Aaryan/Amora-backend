import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { Prisma } from '@prisma/client';

export enum CategoryFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Injectable()
export class AdminCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    cursor?: string;
    limit: number;
    search?: string;
    status?: CategoryFilter;
    sort?: string;
  }) {
    const where: Prisma.CategoryWhereInput = {};
    const orderBy: Prisma.CategoryOrderByWithRelationInput = { name: 'asc' };

    if (params.status === CategoryFilter.ACTIVE) {
      where.is_active = true;
    } else if (params.status === CategoryFilter.INACTIVE) {
      where.is_active = false;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    switch (params.sort) {
      case 'newest':
        orderBy.created_at = 'desc';
        break;
      case 'oldest':
        orderBy.created_at = 'asc';
        break;
      default:
        orderBy.name = 'asc';
    }

    const findManyArgs: Prisma.CategoryFindManyArgs = {
      where,
      orderBy,
      take: params.limit + 1,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { video_categories: true, children: true } },
      },
    };

    if (params.cursor) {
      const decoded = PaginationUtil.decodeCursor(params.cursor);
      findManyArgs.cursor = { id: decoded };
      findManyArgs.skip = 1;
    }

    const categories = await this.prisma.category.findMany(findManyArgs);

    const hasMore = categories.length > params.limit;
    if (hasMore) categories.pop();

    const nextCursor = hasMore
      ? PaginationUtil.encodeCursor(categories[categories.length - 1].id)
      : null;

    return { categories, nextCursor, hasMore };
  }

  async findParentId(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      select: { parent_id: true },
    });
    return cat?.parent_id || null;
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { deleted_at: null },
          select: { id: true, name: true, slug: true, is_active: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { video_categories: true, children: true } },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.category.findUnique({ where: { name } });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({
      data,
      include: {
        parent: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { video_categories: true } },
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.prisma.category.update({
      where: { id },
      data: { is_active: isActive },
      select: {
        id: true,
        name: true,
        slug: true,
        is_active: true,
        updated_at: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        deleted_at: true,
      },
    });
  }
}
