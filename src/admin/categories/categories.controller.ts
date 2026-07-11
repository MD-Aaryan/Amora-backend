import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  ParseEnumPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  AdminCategoriesService,
  CategoryStatusAction,
} from './categories.service';
import { CategoryFilter } from './categories.repository';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@ApiTags('Admin Categories')
@ApiBearerAuth()
@Controller('admin/categories')
@Roles(RoleName.ADMIN)
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all categories',
    description:
      'Returns paginated list of categories with search and status filter.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (active, inactive)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order (alphabetical, newest, oldest)',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listCategories(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: CategoryFilter,
    @Query('sort') sort?: string,
  ) {
    return this.adminCategoriesService.listCategories({
      cursor,
      limit,
      search,
      status,
      sort,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description:
      'Returns category details including parent, children, and video count.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the category' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCategoriesService.getCategoryById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create category',
    description: 'Creates a new category with unique name and slug.',
  })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Name or slug already exists' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminCategoriesService.createCategory(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Updates category name, slug, description, or parent.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the category to update',
  })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Name or slug already exists' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminCategoriesService.updateCategory(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update category status',
    description: 'Activate or deactivate a category.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the category' })
  @ApiQuery({
    name: 'action',
    required: true,
    description: 'Action (activate or deactivate)',
  })
  @ApiResponse({ status: 200, description: 'Category status updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategoryStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('action', new ParseEnumPipe(CategoryStatusAction))
    action: CategoryStatusAction,
  ) {
    return this.adminCategoriesService.updateCategoryStatus(id, action);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete category',
    description:
      'Soft deletes a category. Categories are never permanently deleted.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the category to delete',
  })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCategoriesService.deleteCategory(id);
  }
}
