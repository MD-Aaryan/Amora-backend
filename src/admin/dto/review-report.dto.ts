import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportAction {
  DISMISS = 'dismiss',
  RESOLVE = 'resolve',
}

export class ReviewReportDto {
  @ApiProperty({
    description: 'Action to take on the report',
    enum: ReportAction,
    example: ReportAction.RESOLVE,
  })
  @IsEnum(ReportAction)
  action: ReportAction;

  @ApiPropertyOptional({
    description: 'Resolution notes or details',
    example: 'Content removed after review',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
