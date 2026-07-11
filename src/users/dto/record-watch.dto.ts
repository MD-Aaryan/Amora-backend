import { IsUUID, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordWatchDto {
  @ApiProperty({ description: 'UUID of the video', example: 'uuid-...' })
  @IsUUID()
  videoId: string;

  @ApiPropertyOptional({
    description: 'Last watch position in seconds',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastPosition?: number;

  @ApiPropertyOptional({
    description: 'Whether the video was completed',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  completed?: boolean;
}
