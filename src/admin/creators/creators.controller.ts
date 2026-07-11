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
  ApiBody,
} from '@nestjs/swagger';
import { AdminCreatorsService } from './creators.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { RejectReasonDto } from '../dto/reject-reason.dto';

@ApiTags('Admin Creators')
@ApiBearerAuth()
@Controller('admin/creators')
@Roles(RoleName.ADMIN)
export class AdminCreatorsController {
  constructor(private readonly adminCreatorsService: AdminCreatorsService) {}

  @Get()
  @ApiOperation({
    summary: 'List creator applications',
    description:
      'Returns paginated list of creator profiles with filters and cursor-based pagination.',
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
    description: 'Filter by status (pending, approved, rejected)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, username, or email',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order (newest, oldest, alphabetical, status)',
  })
  @ApiResponse({ status: 200, description: 'Creators retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listCreators(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminCreatorsService.listCreators({
      cursor,
      limit,
      status,
      search,
      sort,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get creator by ID',
    description: 'Returns detailed creator profile including KYC information.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the creator' })
  @ApiResponse({ status: 200, description: 'Creator retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  async getCreatorById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCreatorsService.getCreatorById(id);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve creator application',
    description:
      'Approves a pending creator application and assigns the CREATOR role.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the creator application',
  })
  @ApiResponse({ status: 200, description: 'Creator approved successfully' })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  async approveCreator(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
  ) {
    return this.adminCreatorsService.approveCreator(id, adminUserId);
  }

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject creator application',
    description:
      'Rejects a pending creator application with an optional reason.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the creator application',
  })
  @ApiBody({ type: RejectReasonDto })
  @ApiResponse({ status: 200, description: 'Creator rejected successfully' })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  async rejectCreator(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() dto: RejectReasonDto,
  ) {
    return this.adminCreatorsService.rejectCreator(id, adminUserId, dto.reason);
  }

  @Patch(':id/suspend')
  @ApiOperation({
    summary: 'Suspend creator',
    description: 'Suspends a creator account, disabling platform access.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the creator' })
  @ApiResponse({ status: 200, description: 'Creator suspended successfully' })
  @ApiResponse({ status: 400, description: 'Already suspended' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  async suspendCreator(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCreatorsService.suspendCreator(id);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore creator',
    description:
      'Restores a suspended or rejected creator back to active/pending status.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the creator' })
  @ApiResponse({ status: 200, description: 'Creator restored successfully' })
  @ApiResponse({ status: 400, description: 'Already active' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  async restoreCreator(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCreatorsService.restoreCreator(id);
  }
}
