import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyCommentDto {
  @ApiProperty({
    description: 'Reply content',
    maxLength: 1000,
    example: 'I agree! This technique worked for me too.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
