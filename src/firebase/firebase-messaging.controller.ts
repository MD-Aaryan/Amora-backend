import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { SendToDeviceDto, SendToTopicDto } from './dto/send-message.dto';

@Controller('firebase/messaging')
export class FirebaseMessagingController {
  constructor(private readonly messagingService: FirebaseMessagingService) {}

  @Post('send-device')
  @HttpCode(HttpStatus.OK)
  async sendToDevice(@Body() dto: SendToDeviceDto) {
    const messageId = await this.messagingService.sendToDevice(dto.token, {
      title: dto.title,
      body: dto.body,
      data: dto.data,
    });

    return {
      success: true,
      message: 'Push notification sent to device successfully',
      data: { messageId },
      error: null,
    };
  }

  @Post('send-topic')
  @HttpCode(HttpStatus.OK)
  async sendToTopic(@Body() dto: SendToTopicDto) {
    const messageId = await this.messagingService.sendToTopic(dto.topic, {
      title: dto.title,
      body: dto.body,
      data: dto.data,
    });

    return {
      success: true,
      message: `Push notification sent to topic "${dto.topic}" successfully`,
      data: { messageId },
      error: null,
    };
  }
}
