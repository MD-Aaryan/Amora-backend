import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { FIREBASE_ADMIN_PROVIDER } from './firebase-admin.provider';

@Injectable()
export class FirebaseMessagingService {
  private readonly logger = new Logger(FirebaseMessagingService.name);

  constructor(
    @Inject(FIREBASE_ADMIN_PROVIDER)
    private readonly firebaseAdmin: App,
  ) {}

  /**
   * Send a push notification to a single device using its registration token.
   */
  async sendToDevice(
    token: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<string> {
    if (!token) {
      throw new BadRequestException({
        success: false,
        message: 'Registration token is required',
        error: { code: 'FCM_TOKEN_REQUIRED' },
      });
    }

    try {
      const messageId = await getMessaging(this.firebaseAdmin).send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });

      this.logger.log(
        `Push notification sent successfully to token. Message ID: ${messageId}`,
      );
      return messageId;
    } catch (error: any) {
      this.logger.error(
        `Failed to send push notification to device: ${error.message}`,
        error.stack,
      );

      const errorCode = error.code;
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        throw new BadRequestException({
          success: false,
          message: 'The registration token is invalid or has expired.',
          error: {
            code: 'FCM_INVALID_TOKEN',
            details: error.message,
          },
        });
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to send push notification.',
        error: {
          code: 'FCM_SEND_FAILED',
          details: error.message,
        },
      });
    }
  }

  /**
   * Send a push notification to all devices subscribed to a topic.
   */
  async sendToTopic(
    topic: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<string> {
    if (!topic) {
      throw new BadRequestException({
        success: false,
        message: 'Topic name is required',
        error: { code: 'FCM_TOPIC_REQUIRED' },
      });
    }

    try {
      const messageId = await getMessaging(this.firebaseAdmin).send({
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });

      this.logger.log(
        `Push notification sent successfully to topic "${topic}". Message ID: ${messageId}`,
      );
      return messageId;
    } catch (error: any) {
      this.logger.error(
        `Failed to send push notification to topic "${topic}": ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to send push notification to topic.',
        error: {
          code: 'FCM_TOPIC_SEND_FAILED',
          details: error.message,
        },
      });
    }
  }
}
