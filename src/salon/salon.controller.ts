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
import { SalonService } from './salon.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveRoleGuard } from '../common/guards/active-role.guard';
import { RoleName } from '../common/enums/role.enum';
import { ApplySalonDto } from './dto/apply-salon.dto';
import { UpdateSalonProfileDto } from './dto/update-salon-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('salon')
export class SalonController {
  constructor(private readonly salonService: SalonService) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  async apply(
    @GetUser('id') userId: string,
    @Body() dto: ApplySalonDto,
  ) {
    return this.salonService.apply(userId, dto);
  }

  @Roles(RoleName.SALON)
  @Get('profile')
  async getProfile(@GetUser('id') userId: string) {
    return this.salonService.getProfile(userId);
  }

  @Roles(RoleName.SALON)
  @Patch('profile')
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateSalonProfileDto,
  ) {
    return this.salonService.updateProfile(userId, dto);
  }

  @Roles(RoleName.SALON)
  @Get('dashboard')
  async getDashboard(@GetUser('id') userId: string) {
    return this.salonService.getDashboard(userId);
  }

  @Roles(RoleName.SALON)
  @Get('verification')
  async getVerification(@GetUser('id') userId: string) {
    return this.salonService.getVerification(userId);
  }

  @Roles(RoleName.SALON)
  @Get('services')
  async getServices(@GetUser('id') userId: string) {
    return this.salonService.getServices(userId);
  }

  @Roles(RoleName.SALON)
  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  async createService(
    @GetUser('id') userId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.salonService.createService(userId, dto);
  }

  @Roles(RoleName.SALON)
  @Patch('services/:id')
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
  async deleteService(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
  ) {
    return this.salonService.deleteService(userId, serviceId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Get('applications')
  async getApplications() {
    return this.salonService.getApplications();
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/approve')
  async approveSalon(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
  ) {
    return this.salonService.approveSalon(id, adminUserId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Patch(':id/reject')
  async rejectSalon(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminUserId: string,
    @Body() body: { reason?: string },
  ) {
    return this.salonService.rejectSalon(id, adminUserId, body.reason);
  }
}
