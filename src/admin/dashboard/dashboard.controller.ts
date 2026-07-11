import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin')
@Roles(RoleName.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard overview',
    description:
      'Returns aggregated platform overview including counts and recent activities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getDashboard() {
    return this.dashboardService.getDashboardOverview();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get platform statistics',
    description:
      'Returns detailed aggregated platform statistics for all entity types.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getStatistics() {
    return this.dashboardService.getStatistics();
  }
}
