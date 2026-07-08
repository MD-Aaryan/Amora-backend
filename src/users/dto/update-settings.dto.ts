import { IsOptional, IsBoolean, IsString, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsObject()
  notification_preferences?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  is_profile_public?: boolean;
}
