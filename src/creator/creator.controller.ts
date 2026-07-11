import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { CreatorService } from './creator.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveRoleGuard } from '../common/guards/active-role.guard';
import { RoleName } from '../common/enums/role.enum';
import { ApplyCreatorDto } from './dto/apply-creator.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';

@ApiTags('Creator')
@ApiBearerAuth()
@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Apply as creator',
    description:
      'Submits a creator application with KYC details for admin review.',
  })
  @ApiBody({ type: ApplyCreatorDto })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or already applied.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async apply(@GetUser('id') userId: string, @Body() dto: ApplyCreatorDto) {
    return this.creatorService.apply(userId, dto);
  }

  @Roles(RoleName.CREATOR)
  @Get('profile')
  @ApiOperation({
    summary: 'Get creator profile',
    description: "Returns the authenticated creator's profile.",
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Creator role required.',
  })
  async getProfile(@GetUser('id') userId: string) {
    return this.creatorService.getProfile(userId);
  }

  @Roles(RoleName.CREATOR)
  @Patch('profile')
  @ApiOperation({
    summary: 'Update creator profile',
    description: "Updates the authenticated creator's profile details.",
  })
  @ApiBody({ type: UpdateCreatorProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Creator role required.',
  })
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateCreatorProfileDto,
  ) {
    return this.creatorService.updateProfile(userId, dto);
  }

  @Roles(RoleName.CREATOR)
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get creator dashboard',
    description: 'Returns aggregated dashboard stats for the creator.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Creator role required.',
  })
  async getDashboard(@GetUser('id') userId: string) {
    return this.creatorService.getDashboard(userId);
  }

  @Roles(RoleName.CREATOR)
  @Get('verification')
  @ApiOperation({
    summary: 'Get creator verification status',
    description:
      'Returns the current verification/approval status of the creator.',
  })
  @ApiResponse({ status: 200, description: 'Verification status retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Creator role required.',
  })
  async getVerification(@GetUser('id') userId: string) {
    return this.creatorService.getVerification(userId);
  }

  @Roles(RoleName.CREATOR)
  @Get('videos')
  @ApiOperation({
    summary: 'Get creator videos',
    description: 'Returns all videos uploaded by the authenticated creator.',
  })
  @ApiResponse({ status: 200, description: 'Videos retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Creator role required.',
  })
  async getVideos(@GetUser('id') userId: string) {
    return this.creatorService.getVideos(userId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Get('applications')
  @ApiOperation({
    summary: 'List creator applications',
    description: 'Admin-only: returns all pending creator applications.',
  })
  @ApiResponse({ status: 200, description: 'Applications retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
  async getApplications() {
    return this.creatorService.getApplications();
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve creator application',
    description: 'Admin-only: approves a pending creator application.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the creator application',
  })
  @ApiResponse({ status: 200, description: 'Creator approved.' })
  @ApiResponse({ status: 400, description: 'Application is not pending.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
  @ApiResponse({ status: 404, description: 'Creator not found.' })
  async approveCreator(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
  ) {
    return this.creatorService.approveCreator(id, adminUserId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject creator application',
    description:
      'Admin-only: rejects a pending creator application with an optional reason.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the creator application',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Optional rejection reason' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Creator rejected.' })
  @ApiResponse({ status: 400, description: 'Application is not pending.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
  @ApiResponse({ status: 404, description: 'Creator not found.' })
  async rejectCreator(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() body: { reason?: string },
  ) {
    return this.creatorService.rejectCreator(id, adminUserId, body.reason);
  }
}
