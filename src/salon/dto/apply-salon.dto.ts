import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplySalonDto {
  @ApiProperty({ description: 'Salon name', example: 'Glamour Salon & Spa' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Salon description',
    example:
      'A premium salon offering haircuts, styling, and skincare services',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street, Suite 100',
  })
  @IsString()
  @MaxLength(500)
  address: string;

  @ApiProperty({ description: 'City', example: 'New York' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ description: 'State or region', example: 'New York' })
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({ description: 'ZIP or postal code', example: '10001' })
  @IsString()
  @MaxLength(20)
  zip_code: string;

  @ApiProperty({ description: 'Country', example: 'United States' })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 40.7128 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: -74.006,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Contact phone number', example: '+1234567890' })
  @IsString()
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'salon@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://www.glamoursalon.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({
    description: 'Business hours schedule',
    example: { monday: '09:00-18:00', tuesday: '09:00-18:00' },
  })
  @IsOptional()
  @IsObject()
  business_hours?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Logo image URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({
    description: 'Registered business name for KYC',
    example: 'Glamour Salon LLC',
  })
  @IsString()
  @MaxLength(255)
  kyc_business_name: string;

  @ApiProperty({
    description: 'Business registration number',
    example: 'REG-12345-ABC',
  })
  @IsString()
  @MaxLength(100)
  kyc_registration_number: string;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: 'TAX-98765-XYZ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  kyc_tax_id?: string;

  @ApiProperty({
    description: 'URL of KYC document',
    example: 'https://example.com/kyc/document.pdf',
  })
  @IsString()
  kyc_document_url: string;

  @ApiProperty({
    description: 'URL of owner ID front image',
    example: 'https://example.com/kyc/id-front.jpg',
  })
  @IsString()
  kyc_owner_id_front_url: string;

  @ApiPropertyOptional({
    description: 'URL of owner ID back image',
    example: 'https://example.com/kyc/id-back.jpg',
  })
  @IsOptional()
  @IsString()
  kyc_owner_id_back_url?: string;
}
