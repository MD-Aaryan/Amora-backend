import { IsString, IsOptional, MaxLength, IsEnum, IsNumber, IsObject } from 'class-validator';

export class ApplySalonDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @MaxLength(500)
  address: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(100)
  state: string;

  @IsString()
  @MaxLength(20)
  zip_code: string;

  @IsString()
  @MaxLength(100)
  country: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsString()
  @MaxLength(50)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsObject()
  business_hours?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  logo_url?: string;

  // KYC fields
  @IsString()
  @MaxLength(255)
  kyc_business_name: string;

  @IsString()
  @MaxLength(100)
  kyc_registration_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kyc_tax_id?: string;

  @IsString()
  kyc_document_url: string;

  @IsString()
  kyc_owner_id_front_url: string;

  @IsOptional()
  @IsString()
  kyc_owner_id_back_url?: string;
}
