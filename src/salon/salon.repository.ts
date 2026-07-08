import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApprovalStatus, KycStatus, Prisma } from '@prisma/client';

@Injectable()
export class SalonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.salonProfile.findFirst({
      where: { user_id: userId, deleted_at: null },
      include: {
        kyc: true,
        user: {
          select: {
            display_name: true,
            avatar_url: true,
            preferred_language: true,
            created_at: true,
          },
        },
        services: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.salonProfile.findUnique({
      where: { id },
      include: {
        kyc: true,
        user: {
          select: {
            id: true,
            display_name: true,
            email: true,
            is_active: true,
          },
        },
      },
    });
  }

  async createProfile(
    userId: string,
    data: {
      name: string;
      description?: string;
      address: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
      latitude?: number;
      longitude?: number;
      phone: string;
      email?: string;
      website?: string;
      business_hours?: Record<string, unknown>;
      logo_url?: string;
    },
  ) {
    return this.prisma.salonProfile.create({
      data: {
        user_id: userId,
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        email: data.email,
        website: data.website,
        business_hours: (data.business_hours || {}) as any,
        logo_url: data.logo_url,
        status: ApprovalStatus.PENDING,
      },
      include: { user: true },
    });
  }

  async createKyc(
    profileId: string,
    data: {
      business_name: string;
      registration_number: string;
      tax_id?: string;
      document_url: string;
      owner_id_front_url: string;
      owner_id_back_url?: string;
    },
  ) {
    return this.prisma.salonKyc.create({
      data: {
        salon_profile_id: profileId,
        business_name: data.business_name,
        registration_number: data.registration_number,
        tax_id: data.tax_id,
        document_url: data.document_url,
        owner_id_front_url: data.owner_id_front_url,
        owner_id_back_url: data.owner_id_back_url,
        status: KycStatus.PENDING,
      },
    });
  }

  async updateProfile(id: string, data: Prisma.SalonProfileUpdateInput) {
    return this.prisma.salonProfile.update({
      where: { id },
      data,
      include: {
        kyc: true,
        user: {
          select: {
            display_name: true,
            avatar_url: true,
            preferred_language: true,
            created_at: true,
          },
        },
        services: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async findPendingApplications() {
    return this.prisma.salonProfile.findMany({
      where: { status: ApprovalStatus.PENDING, deleted_at: null },
      include: {
        kyc: true,
        user: {
          select: {
            id: true,
            display_name: true,
            email: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async updateStatus(id: string, status: ApprovalStatus, rejectedReason?: string) {
    return this.prisma.salonProfile.update({
      where: { id },
      data: {
        status,
        rejected_reason: rejectedReason,
        is_verified: status === ApprovalStatus.APPROVED,
      },
    });
  }

  async updateKycStatus(profileId: string, status: KycStatus, reviewedBy: string, rejectionReason?: string) {
    return this.prisma.salonKyc.update({
      where: { salon_profile_id: profileId },
      data: {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_reason: rejectionReason,
      },
    });
  }

  async createService(salonId: string, data: { name: string; description?: string; price: number; duration: number; is_active?: boolean }) {
    return this.prisma.service.create({
      data: {
        salon_id: salonId,
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findServiceById(serviceId: string) {
    return this.prisma.service.findUnique({
      where: { id: serviceId, deleted_at: null },
    });
  }

  async findServicesBySalonId(salonId: string) {
    return this.prisma.service.findMany({
      where: { salon_id: salonId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateService(serviceId: string, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({
      where: { id: serviceId },
      data,
    });
  }

  async deleteService(serviceId: string) {
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { deleted_at: new Date() },
    });
  }

  async countServices(salonId: string) {
    return this.prisma.service.count({
      where: { salon_id: salonId, deleted_at: null },
    });
  }

  async countVideos(_salonId: string) {
    return 0;
  }
}
