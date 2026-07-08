import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';

export enum IdTypeDto {
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  NATIONAL_ID = 'NATIONAL_ID',
}

export class ApplyCreatorDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram_handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tiktok_handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  youtube_handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website_url?: string;

  @IsString()
  @MaxLength(255)
  kyc_full_name: string;

  @IsEnum(IdTypeDto)
  kyc_id_type: IdTypeDto;

  @IsString()
  @MaxLength(100)
  kyc_id_number: string;

  @IsString()
  kyc_id_front_url: string;

  @IsOptional()
  @IsString()
  kyc_id_back_url?: string;

  @IsString()
  kyc_selfie_url: string;
}
