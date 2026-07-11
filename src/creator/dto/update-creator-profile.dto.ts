import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCreatorProfileDto {
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
}
