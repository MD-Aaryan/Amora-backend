import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VideoVisibilityDto {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export class CreateVideoDto {
  @ApiProperty({ description: 'Video title', example: 'My Amazing Video' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Video description',
    example: 'This is a detailed description of the video',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Array of category UUIDs',
    example: ['uuid1-...', 'uuid2-...'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  category_ids: string[];

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
}
