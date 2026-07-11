import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum VideoVisibilityDto {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export class UpdateVideoDto {
  @ApiPropertyOptional({
    description: 'Video title',
    example: 'My Amazing Video',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Video description',
    example: 'This is a detailed description of the video',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of category UUIDs',
    example: ['uuid1-...', 'uuid2-...'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  category_ids?: string[];

  @ApiPropertyOptional({
    description: 'Array of tags',
    example: ['tutorial', 'music'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Language code', example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({
    description: 'Video visibility',
    enum: VideoVisibilityDto,
    example: VideoVisibilityDto.PUBLIC,
  })
  @IsOptional()
  @IsEnum(VideoVisibilityDto)
  visibility?: VideoVisibilityDto;

  @ApiPropertyOptional({
    description: 'Whether the video is free',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_free?: boolean;

  @ApiPropertyOptional({ description: 'Price of the video', example: 9.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;
}
