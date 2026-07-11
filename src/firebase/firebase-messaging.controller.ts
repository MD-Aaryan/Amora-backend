import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { SendToDeviceDto, SendToTopicDto } from './dto/send-message.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../common/enums/role.enum';

@ApiTags('Firebase Messaging')
@ApiBearerAuth()
@Controller('firebase/messaging')
@Roles(RoleName.ADMIN)
export class FirebaseMessagingController {
  constructor(private readonly messagingService: FirebaseMessagingService) {}

  @Post('send-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send push notification to device',
    description:
      'Sends a push notification to a single device by FCM registration token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Push notification sent to device.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
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
  @ApiOperation({
    summary: 'Send push notification to topic',
    description:
      'Sends a push notification to all devices subscribed to an FCM topic.',
  })
  @ApiResponse({ status: 200, description: 'Push notification sent to topic.' })
  @ApiResponse({ status: 400, description: 'Topic name is required.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
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
