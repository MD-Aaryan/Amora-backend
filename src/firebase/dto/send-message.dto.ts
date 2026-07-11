import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendToDeviceDto {
  @ApiProperty({
    description: 'FCM device token',
    example: 'fcm-device-token-abc123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Device token is required' })
  token: string;

  @ApiProperty({ description: 'Notification title', example: 'New Message' })
  @IsString()
  @IsNotEmpty({ message: 'Notification title is required' })
  title: string;

  @ApiProperty({
    description: 'Notification body content',
    example: 'You have a new message from John',
  })
  @IsString()
  @IsNotEmpty({ message: 'Notification body is required' })
  body: string;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { type: 'message', sender_id: '123' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, string>;
}

export class SendToTopicDto {
  @ApiProperty({
    description: 'FCM topic name',
    example: 'general_notifications',
  })
  @IsString()
  @IsNotEmpty({ message: 'Topic name is required' })
  topic: string;

  @ApiProperty({ description: 'Notification title', example: 'New Update' })
  @IsString()
  @IsNotEmpty({ message: 'Notification title is required' })
  title: string;

  @ApiProperty({
    description: 'Notification body content',
    example: 'Check out the latest updates',
  })
  @IsString()
  @IsNotEmpty({ message: 'Notification body is required' })
  body: string;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { type: 'update', priority: 'high' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, string>;
}
