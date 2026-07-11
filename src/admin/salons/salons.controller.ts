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
import { AdminSalonsService } from './salons.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { RejectReasonDto } from '../dto/reject-reason.dto';

@ApiTags('Admin Salons')
@ApiBearerAuth()
@Controller('admin/salons')
@Roles(RoleName.ADMIN)
export class AdminSalonsController {
  constructor(private readonly adminSalonsService: AdminSalonsService) {}

  @Get()
  @ApiOperation({
    summary: 'List salon applications',
    description:
      'Returns paginated list of salon profiles with filters and cursor-based pagination.',
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
    description: 'Search by name, owner name, or email',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order (newest, oldest, alphabetical, status)',
  })
  @ApiResponse({ status: 200, description: 'Salons retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listSalons(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminSalonsService.listSalons({
      cursor,
      limit,
      status,
      search,
      sort,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get salon by ID',
    description: 'Returns detailed salon profile including KYC information.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the salon' })
  @ApiResponse({ status: 200, description: 'Salon retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async getSalonById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminSalonsService.getSalonById(id);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve salon application',
    description:
      'Approves a pending salon application and assigns the SALON role.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the salon application',
  })
  @ApiResponse({ status: 200, description: 'Salon approved successfully' })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async approveSalon(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
  ) {
    return this.adminSalonsService.approveSalon(id, adminUserId);
  }

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject salon application',
    description: 'Rejects a pending salon application with an optional reason.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the salon application',
  })
  @ApiBody({ type: RejectReasonDto })
  @ApiResponse({ status: 200, description: 'Salon rejected successfully' })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async rejectSalon(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() dto: RejectReasonDto,
  ) {
    return this.adminSalonsService.rejectSalon(id, adminUserId, dto.reason);
  }

  @Patch(':id/suspend')
  @ApiOperation({
    summary: 'Suspend salon',
    description: 'Suspends a salon account, disabling platform access.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the salon' })
  @ApiResponse({ status: 200, description: 'Salon suspended successfully' })
  @ApiResponse({ status: 400, description: 'Already suspended' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async suspendSalon(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminSalonsService.suspendSalon(id);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore salon',
    description:
      'Restores a suspended or rejected salon back to active/pending status.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the salon' })
  @ApiResponse({ status: 200, description: 'Salon restored successfully' })
  @ApiResponse({ status: 400, description: 'Already active' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async restoreSalon(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminSalonsService.restoreSalon(id);
  }
}
