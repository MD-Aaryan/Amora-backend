import { IsUUID, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWatchHistoryDto {
  @ApiProperty({
    description: 'Video ID',
    format: 'uuid',
  })
  @IsUUID()
  videoId: string;

  @ApiProperty({
    description: 'Last watched position in seconds',
    example: 45.5,
  })
  @IsNumber()
  @Min(0)
  lastPosition: number;

  @ApiPropertyOptional({
    description: 'Total watch duration in seconds',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  watchDuration?: number;

  @ApiPropertyOptional({
    description: 'Whether video was completed',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
