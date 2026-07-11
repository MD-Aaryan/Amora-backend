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
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AdminReportsService } from './reports.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';

@ApiTags('Admin Reports')
@ApiBearerAuth()
@Controller('admin/reports')
@Roles(RoleName.ADMIN)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all reports',
    description:
      'Returns paginated list of reports with status and reason filters.',
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
    description:
      'Filter by status (pending, under_review, resolved, dismissed)',
  })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Filter by reason',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order (newest, oldest)',
  })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listReports(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('reason') reason?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminReportsService.listReports({
      cursor,
      limit,
      status,
      reason,
      sort,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get report by ID',
    description:
      'Returns detailed report information including all referenced content.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminReportsService.getReportById(id);
  }

  @Patch(':id/review')
  @ApiOperation({
    summary: 'Review report',
    description: 'Marks a pending report as under review.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the report' })
  @ApiResponse({ status: 200, description: 'Report is now under review' })
  @ApiResponse({ status: 400, description: 'Report is not pending' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async reviewReport(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
  ) {
    return this.adminReportsService.reviewReport(id, adminUserId);
  }

  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'Resolve report',
    description: 'Resolves a report with optional resolution notes.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the report' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'Optional resolution notes' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Report resolved successfully' })
  @ApiResponse({ status: 400, description: 'Already resolved' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async resolveReport(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminReportsService.resolveReport(id, adminUserId, body.notes);
  }

  @Patch(':id/dismiss')
  @ApiOperation({
    summary: 'Dismiss report',
    description: 'Dismisses a report with optional notes.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the report' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'Optional dismissal notes' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Report dismissed' })
  @ApiResponse({ status: 400, description: 'Already dismissed' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async dismissReport(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminReportsService.dismissReport(id, adminUserId, body.notes);
  }
}
