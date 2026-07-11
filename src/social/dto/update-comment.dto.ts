import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    maxLength: 1000,
    example: 'Updated: This is really well explained!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
