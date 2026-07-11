import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSearchHistoryDto {
  @ApiProperty({
    description: 'Search keyword to save',
    example: 'nail art',
    minLength: 1,
  })
  @IsString()
  keyword: string;
}

export class SearchFilterDto {
  @ApiPropertyOptional({
    description: 'Search keyword (optional - returns all if omitted)',
    example: 'nail',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by language (e.g., "en", "hi")' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Filter by creator UUID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ description: 'Filter by salon UUID' })
  @IsOptional()
  @IsString()
  salonId?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['newest', 'oldest', 'most_viewed'],
    default: 'newest',
  })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'most_viewed'])
  sort?: string;

  @ApiPropertyOptional({ description: 'Pagination cursor' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Items per page (1-50)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
