import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SalonService } from './salon.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveRoleGuard } from '../common/guards/active-role.guard';
import { RoleName } from '../common/enums/role.enum';
import { ApplySalonDto } from './dto/apply-salon.dto';
import { UpdateSalonProfileDto } from './dto/update-salon-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('Salon')
@ApiBearerAuth()
@Controller('salon')
export class SalonController {
  constructor(private readonly salonService: SalonService) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Apply as salon',
    description:
      'Submits a salon application with business details for admin review.',
  })
  @ApiBody({ type: ApplySalonDto })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or already applied.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async apply(@GetUser('id') userId: string, @Body() dto: ApplySalonDto) {
    return this.salonService.apply(userId, dto);
  }

  @Roles(RoleName.SALON)
  @Get('profile')
  @ApiOperation({
    summary: 'Get salon profile',
    description: "Returns the authenticated salon's profile.",
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  async getProfile(@GetUser('id') userId: string) {
    return this.salonService.getProfile(userId);
  }

  @Roles(RoleName.SALON)
  @Patch('profile')
  @ApiOperation({
    summary: 'Update salon profile',
    description: "Updates the authenticated salon's profile details.",
  })
  @ApiBody({ type: UpdateSalonProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateSalonProfileDto,
  ) {
    return this.salonService.updateProfile(userId, dto);
  }

  @Roles(RoleName.SALON)
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get salon dashboard',
    description: 'Returns aggregated dashboard stats for the salon.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  async getDashboard(@GetUser('id') userId: string) {
    return this.salonService.getDashboard(userId);
  }

  @Roles(RoleName.SALON)
  @Get('verification')
  @ApiOperation({
    summary: 'Get salon verification status',
    description:
      'Returns the current verification/approval status of the salon.',
  })
  @ApiResponse({ status: 200, description: 'Verification status retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  async getVerification(@GetUser('id') userId: string) {
    return this.salonService.getVerification(userId);
  }

  @Roles(RoleName.SALON)
  @Get('services')
  @ApiOperation({
    summary: 'List salon services',
    description: 'Returns all services offered by the authenticated salon.',
  })
  @ApiResponse({ status: 200, description: 'Services retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  async getServices(@GetUser('id') userId: string) {
    return this.salonService.getServices(userId);
  }

  @Roles(RoleName.SALON)
  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a service',
    description: 'Creates a new service offered by the authenticated salon.',
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: 'Service created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  async createService(
    @GetUser('id') userId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.salonService.createService(userId, dto);
  }

  @Roles(RoleName.SALON)
  @Patch('services/:id')
  @ApiOperation({
    summary: 'Update a service',
    description: 'Updates an existing service offered by the salon.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the service' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: 'Service updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async updateService(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.salonService.updateService(userId, serviceId, dto);
  }

  @Roles(RoleName.SALON)
  @Delete('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a service',
    description: 'Deletes a service offered by the salon.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Salon role required.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async deleteService(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
  ) {
    return this.salonService.deleteService(userId, serviceId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Get('applications')
  @ApiOperation({
    summary: 'List salon applications',
    description: 'Admin-only: returns all pending salon applications.',
  })
  @ApiResponse({ status: 200, description: 'Applications retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
  async getApplications() {
    return this.salonService.getApplications();
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve salon application',
    description: 'Admin-only: approves a pending salon application.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the salon application',
  })
  @ApiResponse({ status: 200, description: 'Salon approved.' })
  @ApiResponse({ status: 400, description: 'Application is not pending.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
  @ApiResponse({ status: 404, description: 'Salon not found.' })
  async approveSalon(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
  ) {
    return this.salonService.approveSalon(id, adminUserId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject salon application',
    description:
      'Admin-only: rejects a pending salon application with an optional reason.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the salon application',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Optional rejection reason' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Salon rejected.' })
  @ApiResponse({ status: 400, description: 'Application is not pending.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
  @ApiResponse({ status: 404, description: 'Salon not found.' })
  async rejectSalon(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() body: { reason?: string },
  ) {
    return this.salonService.rejectSalon(id, adminUserId, body.reason);
  }
}
