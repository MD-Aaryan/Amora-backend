import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search keyword - minimum 2 characters',
    example: 'nail art',
    minLength: 2,
  })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pagination cursor (base64-encoded createdAt_videoId)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Items per section (1-50)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchVideoQueryDto {
  @ApiProperty({
    description: 'Search keyword - minimum 2 characters',
    example: 'hair tutorial',
    minLength: 2,
  })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pagination cursor',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Items per page (1-50)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchCreatorQueryDto {
  @ApiProperty({
    description: 'Search keyword - minimum 2 characters',
    example: 'stylist',
    minLength: 2,
  })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pagination cursor',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Items per page (1-50)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchSalonQueryDto {
  @ApiProperty({
    description: 'Search keyword - minimum 2 characters',
    example: 'downtown salon',
    minLength: 2,
  })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pagination cursor',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Items per page (1-50)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchCategoryQueryDto {
  @ApiProperty({
    description: 'Search keyword - minimum 2 characters',
    example: 'nail',
    minLength: 2,
  })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pagination cursor',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Items per page (1-50)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchTagQueryDto {
  @ApiProperty({
    description: 'Search keyword - minimum 2 characters',
    example: 'nail',
    minLength: 2,
  })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pagination cursor',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Items per page (1-50)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchSuggestionsQueryDto {
  @ApiProperty({
    description: 'Search keyword - minimum 2 characters',
    example: 'nail',
    minLength: 2,
  })
  @IsString()
  keyword: string;
}
