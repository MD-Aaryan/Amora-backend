import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FeedQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination. Base64-encoded createdAt and videoId.',
    example:
      'MjAyNC0wMS0wMVQwMDowMDowMC4wMDBaXzEyMzQ1Njc4LTkwYWItY2RlZi0wMTIzLTQ1Njc4OTBhYmNk',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items to return (1-50)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
