import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminUsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@Roles(RoleName.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List all users',
    description:
      'Returns paginated list of users with filters and cursor-based pagination.',
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
    name: 'status',
    required: false,
    description: 'Filter by status (active, suspended, blocked, deleted)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter by role (customer, creator, salon, admin)',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by country',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Filter by preferred language',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, username, or email',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order (newest, oldest, alphabetical)',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listUsers(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('country') country?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminUsersService.listUsers({
      cursor,
      limit,
      status,
      role,
      country,
      language,
      search,
      sort,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Returns detailed user profile including roles and related profiles.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the user' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update user status',
    description: 'Activate, suspend, block, or soft-delete a user.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the user' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateUserStatus(id, dto.action);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a deleted user',
    description: 'Restores a soft-deleted user back to active status.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the user to restore',
  })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restoreUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsersService.restoreUser(id);
  }
}
