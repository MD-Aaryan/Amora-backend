import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  url: string;
}
