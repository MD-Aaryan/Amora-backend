import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    maxLength: 1000,
    example: 'Great video! Very helpful tutorial.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
