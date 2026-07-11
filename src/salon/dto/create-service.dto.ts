import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Haircut & Styling' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'A premium haircut with professional styling',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Service price', example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Duration in minutes', example: 60 })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
