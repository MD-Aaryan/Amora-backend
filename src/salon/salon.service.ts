import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SalonRepository } from './salon.repository';
import { UsersRepository } from '../users/users.repository';
import { ApplySalonDto } from './dto/apply-salon.dto';
import { UpdateSalonProfileDto } from './dto/update-salon-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SalonProfileEntity } from './entities/salon-profile.entity';
import { SalonDashboardEntity } from './entities/salon-dashboard.entity';
import { ServiceEntity } from './entities/service.entity';
import { ApprovalStatus, KycStatus, UserStatus } from '@prisma/client';

@Injectable()
export class SalonService {
  private readonly logger = new Logger(SalonService.name);

  constructor(
    private readonly salonRepository: SalonRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async apply(userId: string, dto: ApplySalonDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ success: false, message: 'User not found.', error: { code: 'USER_NOT_FOUND' } });
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new ForbiddenException({ success: false, message: 'Account is not eligible.', error: { code: 'ACCOUNT_INELIGIBLE' } });
    }

    const existingProfile = await this.salonRepository.findByUserId(userId);
    if (existingProfile) {
      if (existingProfile.status === ApprovalStatus.PENDING) {
        throw new ConflictException({ success: false, message: 'Salon application already pending.', error: { code: 'APPLICATION_PENDING' } });
      }
      if (existingProfile.status === ApprovalStatus.APPROVED) {
        throw new ConflictException({ success: false, message: 'Already a salon partner.', error: { code: 'ALREADY_SALON' } });
      }
      throw new ConflictException({ success: false, message: 'Salon application already exists.', error: { code: 'APPLICATION_EXISTS' } });
    }

    const profile = await this.salonRepository.createProfile(userId, {
      name: dto.name,
      description: dto.description,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      zip_code: dto.zip_code,
      country: dto.country,
      latitude: dto.latitude,
      longitude: dto.longitude,
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
      business_hours: dto.business_hours,
      logo_url: dto.logo_url,
    });

    await this.salonRepository.createKyc(profile.id, {
      business_name: dto.kyc_business_name,
      registration_number: dto.kyc_registration_number,
      tax_id: dto.kyc_tax_id,
      document_url: dto.kyc_document_url,
      owner_id_front_url: dto.kyc_owner_id_front_url,
      owner_id_back_url: dto.kyc_owner_id_back_url,
    });

    this.logger.log(`Salon application submitted for user ${userId}`);

    return {
      profileId: profile.id,
      status: profile.status,
      message: 'Salon application submitted successfully. Awaiting admin review.',
    };
  }

  async getProfile(userId: string): Promise<SalonProfileEntity> {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    return this.mapProfileToEntity(profile);
  }

  async updateProfile(userId: string, dto: UpdateSalonProfileDto): Promise<SalonProfileEntity> {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.zip_code !== undefined) data.zip_code = dto.zip_code;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.business_hours !== undefined) data.business_hours = dto.business_hours;
    if (dto.logo_url !== undefined) data.logo_url = dto.logo_url;

    const updated = await this.salonRepository.updateProfile(profile.id, data);
    return this.mapProfileToEntity(updated);
  }

  async getDashboard(userId: string): Promise<SalonDashboardEntity> {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    const [totalServices, totalVideos] = await Promise.all([
      this.salonRepository.countServices(profile.id),
      this.salonRepository.countVideos(profile.id),
    ]);

    return {
      salonName: profile.name,
      logoUrl: profile.logo_url || null,
      partnerId: profile.id,
      verificationStatus: profile.status,
      totalServices,
      totalVideos,
    };
  }

  async getVerification(userId: string) {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    return {
      status: profile.kyc?.status || KycStatus.PENDING,
      submittedAt: profile.kyc?.submitted_at || null,
      reviewedAt: profile.kyc?.reviewed_at || null,
      rejectionReason: profile.kyc?.rejection_reason || null,
    };
  }

  async getServices(userId: string) {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    const services = await this.salonRepository.findServicesBySalonId(profile.id);
    return services.map((s) => this.mapServiceToEntity(s));
  }

  async createService(userId: string, dto: CreateServiceDto): Promise<ServiceEntity> {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    const service = await this.salonRepository.createService(profile.id, {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      duration: dto.duration,
      is_active: dto.is_active,
    });

    return this.mapServiceToEntity(service);
  }

  async updateService(userId: string, serviceId: string, dto: UpdateServiceDto): Promise<ServiceEntity> {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    const service = await this.salonRepository.findServiceById(serviceId);
    if (!service || service.salon_id !== profile.id) {
      throw new NotFoundException({ success: false, message: 'Service not found.', error: { code: 'SERVICE_NOT_FOUND' } });
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.duration !== undefined) data.duration = dto.duration;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    const updated = await this.salonRepository.updateService(serviceId, data);
    return this.mapServiceToEntity(updated);
  }

  async deleteService(userId: string, serviceId: string) {
    const profile = await this.salonRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon profile not found.', error: { code: 'PROFILE_NOT_FOUND' } });
    }

    const service = await this.salonRepository.findServiceById(serviceId);
    if (!service || service.salon_id !== profile.id) {
      throw new NotFoundException({ success: false, message: 'Service not found.', error: { code: 'SERVICE_NOT_FOUND' } });
    }

    await this.salonRepository.deleteService(serviceId);
    return { message: 'Service deleted successfully.' };
  }

  async getApplications() {
    return this.salonRepository.findPendingApplications();
  }

  async approveSalon(profileId: string, adminUserId: string) {
    const profile = await this.salonRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon application not found.', error: { code: 'APPLICATION_NOT_FOUND' } });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({ success: false, message: 'Application is not pending.', error: { code: 'APPLICATION_NOT_PENDING' } });
    }

    await this.salonRepository.updateStatus(profileId, ApprovalStatus.APPROVED);
    await this.salonRepository.updateKycStatus(profileId, KycStatus.APPROVED, adminUserId);

    await this.usersRepository.assignRole(profile.user_id, 'SALON');

    this.logger.log(`Salon ${profileId} approved by admin ${adminUserId}`);

    return { message: 'Salon approved successfully.' };
  }

  async rejectSalon(profileId: string, adminUserId: string, reason?: string) {
    const profile = await this.salonRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException({ success: false, message: 'Salon application not found.', error: { code: 'APPLICATION_NOT_FOUND' } });
    }

    if (profile.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException({ success: false, message: 'Application is not pending.', error: { code: 'APPLICATION_NOT_PENDING' } });
    }

    await this.salonRepository.updateStatus(profileId, ApprovalStatus.REJECTED, reason);
    await this.salonRepository.updateKycStatus(profileId, KycStatus.REJECTED, adminUserId, reason);

    this.logger.log(`Salon ${profileId} rejected by admin ${adminUserId}`);

    return { message: 'Salon application rejected.' };
  }

  private mapProfileToEntity(profile: any): SalonProfileEntity {
    return {
      id: profile.id,
      userId: profile.user_id,
      name: profile.name,
      ownerName: profile.user?.display_name || null,
      logoUrl: profile.logo_url || null,
      description: profile.description || null,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zip_code,
      country: profile.country,
      latitude: profile.latitude || null,
      longitude: profile.longitude || null,
      phone: profile.phone,
      email: profile.email || null,
      website: profile.website || null,
      businessHours: profile.business_hours || {},
      preferredLanguage: profile.user?.preferred_language || 'en',
      verificationStatus: profile.status,
      kycStatus: profile.kyc?.status || null,
      joinedAt: profile.user?.created_at || profile.created_at,
    };
  }

  private mapServiceToEntity(service: any): ServiceEntity {
    return {
      id: service.id,
      salonId: service.salon_id,
      name: service.name,
      description: service.description || null,
      price: Number(service.price),
      duration: service.duration,
      isActive: service.is_active,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
    };
  }
}
