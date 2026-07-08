import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
