import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class SendToDeviceDto {
  @IsString()
  @IsNotEmpty({ message: 'Device token is required' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'Notification title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Notification body is required' })
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, string>;
}

export class SendToTopicDto {
  @IsString()
  @IsNotEmpty({ message: 'Topic name is required' })
  topic: string;

  @IsString()
  @IsNotEmpty({ message: 'Notification title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Notification body is required' })
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, string>;
}
