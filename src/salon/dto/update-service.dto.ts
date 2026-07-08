import { IsOptional, IsString, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
