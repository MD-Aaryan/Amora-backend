import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  AdminCategoriesRepository,
  CategoryFilter,
} from './categories.repository';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Prisma } from '@prisma/client';

export enum CategoryStatusAction {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
}

@Injectable()
export class AdminCategoriesService {
  private readonly logger = new Logger(AdminCategoriesService.name);

  constructor(
    private readonly adminCategoriesRepository: AdminCategoriesRepository,
  ) {}

  async listCategories(params: {
    cursor?: string;
    limit?: number;
    search?: string;
    status?: CategoryFilter;
    sort?: string;
  }) {
    const limit = Math.min(100, Math.max(1, params.limit || 50));

    const result = await this.adminCategoriesRepository.findMany({
      cursor: params.cursor,
      limit,
      search: params.search,
      status: params.status,
      sort: params.sort,
    });

    const categories = result.categories as any[];

    return {
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        parentId: c.parent_id,
        parentName: c.parent?.name || null,
        isActive: c.is_active,
        videoCount: c._count?.video_categories || 0,
        childrenCount: c._count?.children || 0,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async getCategoryById(categoryId: string) {
    const category = (await this.adminCategoriesRepository.findById(
      categoryId,
    )) as any;
    if (!category) {
      throw new NotFoundException({
        success: false,
        message: 'Category not found.',
        error: { code: 'CATEGORY_NOT_FOUND' },
      });
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      parentId: category.parent_id,
      parent: category.parent || null,
      isActive: category.is_active,
      children: category.children || [],
      videoCount: category._count?.video_categories || 0,
      childrenCount: category._count?.children || 0,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.adminCategoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'Category name already exists.',
        error: { code: 'CATEGORY_NAME_EXISTS' },
      });
    }

    const existingSlug = await this.adminCategoriesRepository.findBySlug(
      dto.slug,
    );
    if (existingSlug) {
      throw new ConflictException({
        success: false,
        message: 'Category slug already exists.',
        error: { code: 'CATEGORY_SLUG_EXISTS' },
      });
    }

    if (dto.parent_id) {
      const parent = await this.adminCategoriesRepository.findById(
        dto.parent_id,
      );
      if (!parent) {
        throw new NotFoundException({
          success: false,
          message: 'Parent category not found.',
          error: { code: 'PARENT_NOT_FOUND' },
        });
      }
    }

    const createData: Prisma.CategoryCreateInput = {
      name: dto.name,
      slug: dto.slug,
    };
    if (dto.description !== undefined) createData.description = dto.description;
    if (dto.parent_id !== undefined)
      createData.parent = { connect: { id: dto.parent_id } };

    const category = await this.adminCategoriesRepository.create(createData);

    this.logger.log(`Category ${category.id} created`);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      parentId: category.parent_id,
      parentName: (category as any).parent?.name || null,
      isActive: true,
      message: 'Category created successfully.',
    };
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.adminCategoriesRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException({
        success: false,
        message: 'Category not found.',
        error: { code: 'CATEGORY_NOT_FOUND' },
      });
    }

    if (dto.name && dto.name !== category.name) {
      const existing = await this.adminCategoriesRepository.findByName(
        dto.name,
      );
      if (existing) {
        throw new ConflictException({
          success: false,
          message: 'Category name already exists.',
          error: { code: 'CATEGORY_NAME_EXISTS' },
        });
      }
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existingSlug = await this.adminCategoriesRepository.findBySlug(
        dto.slug,
      );
      if (existingSlug) {
        throw new ConflictException({
          success: false,
          message: 'Category slug already exists.',
          error: { code: 'CATEGORY_SLUG_EXISTS' },
        });
      }
    }

    if (dto.parent_id) {
      if (dto.parent_id === categoryId) {
        throw new BadRequestException({
          success: false,
          message: 'Category cannot be its own parent.',
          error: { code: 'SELF_PARENT' },
        });
      }
      const parent = await this.adminCategoriesRepository.findById(
        dto.parent_id,
      );
      if (!parent) {
        throw new NotFoundException({
          success: false,
          message: 'Parent category not found.',
          error: { code: 'PARENT_NOT_FOUND' },
        });
      }
      await this.detectCategoryCycle(categoryId, dto.parent_id);
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.parent_id !== undefined)
      data.parent = { connect: { id: dto.parent_id } };

    const updated = (await this.adminCategoriesRepository.update(
      categoryId,
      data,
    )) as any;

    this.logger.log(`Category ${categoryId} updated`);

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description || null,
      parentId: updated.parent_id,
      parentName: updated.parent?.name || null,
      isActive: updated.is_active,
      videoCount: updated._count?.video_categories || 0,
      updatedAt: updated.updated_at,
      message: 'Category updated successfully.',
    };
  }

  async updateCategoryStatus(categoryId: string, action: CategoryStatusAction) {
    const category = await this.adminCategoriesRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException({
        success: false,
        message: 'Category not found.',
        error: { code: 'CATEGORY_NOT_FOUND' },
      });
    }

    const isActive = action === CategoryStatusAction.ACTIVATE;
    const updated = await this.adminCategoriesRepository.updateStatus(
      categoryId,
      isActive,
    );

    this.logger.log(`Category ${categoryId} ${action}d`);

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      isActive: updated.is_active,
      message: `Category ${action}d successfully.`,
    };
  }

  async deleteCategory(categoryId: string) {
    const category = await this.adminCategoriesRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException({
        success: false,
        message: 'Category not found.',
        error: { code: 'CATEGORY_NOT_FOUND' },
      });
    }

    await this.adminCategoriesRepository.softDelete(categoryId);

    this.logger.log(`Category ${categoryId} soft deleted`);

    return { message: 'Category deleted successfully.' };
  }

  private async detectCategoryCycle(categoryId: string, newParentId: string) {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === categoryId) {
        throw new BadRequestException({
          success: false,
          message:
            'Circular reference detected: category cannot be its own ancestor.',
          error: { code: 'CIRCULAR_PARENT' },
        });
      }

      if (visited.has(currentId)) {
        throw new BadRequestException({
          success: false,
          message: 'Circular reference detected in parent chain.',
          error: { code: 'CIRCULAR_PARENT_CHAIN' },
        });
      }

      visited.add(currentId);
      currentId = await this.adminCategoriesRepository.findParentId(currentId);
    }
  }
}
