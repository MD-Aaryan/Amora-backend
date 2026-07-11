import { IsOptional, IsBoolean, IsString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Notification preferences key-value map',
    example: { email: true, push: false },
  })
  @IsOptional()
  @IsObject()
  notification_preferences?: Record<string, boolean>;

  @ApiPropertyOptional({
    description: 'Preferred language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Whether the profile is publicly visible',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_profile_public?: boolean;
}
