import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IdTypeDto {
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  NATIONAL_ID = 'NATIONAL_ID',
}

export class ApplyCreatorDto {
  @ApiPropertyOptional({
    description: 'Creator biography',
    example: 'Travel content creator and photographer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Instagram handle',
    example: '@travel_creator',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram_handle?: string;

  @ApiPropertyOptional({
    description: 'TikTok handle',
    example: '@travel_creator',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tiktok_handle?: string;

  @ApiPropertyOptional({
    description: 'YouTube handle',
    example: '@TravelCreator',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  youtube_handle?: string;

  @ApiPropertyOptional({
    description: 'Personal website URL',
    example: 'https://travelcreator.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website_url?: string;

  @ApiProperty({
    description: 'Full legal name for KYC',
    example: 'John Michael Doe',
  })
  @IsString()
  @MaxLength(255)
  kyc_full_name: string;

  @ApiProperty({
    description: 'Type of identification document',
    enum: IdTypeDto,
    example: IdTypeDto.PASSPORT,
  })
  @IsEnum(IdTypeDto)
  kyc_id_type: IdTypeDto;

  @ApiProperty({
    description: 'Identification document number',
    example: 'AB1234567',
  })
  @IsString()
  @MaxLength(100)
  kyc_id_number: string;

  @ApiProperty({
    description: 'URL of ID document front image',
    example: 'https://example.com/kyc/id-front.jpg',
  })
  @IsString()
  kyc_id_front_url: string;

  @ApiPropertyOptional({
    description: 'URL of ID document back image',
    example: 'https://example.com/kyc/id-back.jpg',
  })
  @IsOptional()
  @IsString()
  kyc_id_back_url?: string;

  @ApiProperty({
    description: 'URL of selfie image for KYC',
    example: 'https://example.com/kyc/selfie.jpg',
  })
  @IsString()
  kyc_selfie_url: string;
}
