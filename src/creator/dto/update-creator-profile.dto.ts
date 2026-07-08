import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCreatorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram_handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tiktok_handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  youtube_handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website_url?: string;
}
