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
import { CreatorService } from './creator.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveRoleGuard } from '../common/guards/active-role.guard';
import { RoleName } from '../common/enums/role.enum';
import { ApplyCreatorDto } from './dto/apply-creator.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';

@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  async apply(
    @GetUser('id') userId: string,
    @Body() dto: ApplyCreatorDto,
  ) {
    return this.creatorService.apply(userId, dto);
  }

  @Roles(RoleName.CREATOR)
  @Get('profile')
  async getProfile(@GetUser('id') userId: string) {
    return this.creatorService.getProfile(userId);
  }

  @Roles(RoleName.CREATOR)
  @Patch('profile')
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateCreatorProfileDto,
  ) {
    return this.creatorService.updateProfile(userId, dto);
  }

  @Roles(RoleName.CREATOR)
  @Get('dashboard')
  async getDashboard(@GetUser('id') userId: string) {
    return this.creatorService.getDashboard(userId);
  }

  @Roles(RoleName.CREATOR)
  @Get('verification')
  async getVerification(@GetUser('id') userId: string) {
    return this.creatorService.getVerification(userId);
  }

  @Roles(RoleName.CREATOR)
  @Get('videos')
  async getVideos(@GetUser('id') userId: string) {
    return this.creatorService.getVideos(userId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Get('applications')
  async getApplications() {
    return this.creatorService.getApplications();
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/approve')
  async approveCreator(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
  ) {
    return this.creatorService.approveCreator(id, adminUserId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/reject')
  async rejectCreator(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() body: { reason?: string },
  ) {
    return this.creatorService.rejectCreator(id, adminUserId, body.reason);
  }
}
