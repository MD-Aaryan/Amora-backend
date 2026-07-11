import {
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSalonProfileDto {
  @ApiPropertyOptional({
    description: 'Salon name',
    example: 'Glamour Salon & Spa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Salon description',
    example:
      'A premium salon offering haircuts, styling, and skincare services',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main Street, Suite 100',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State or region', example: 'New York' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP or postal code', example: '10001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip_code?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'United States' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

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

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

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
}
