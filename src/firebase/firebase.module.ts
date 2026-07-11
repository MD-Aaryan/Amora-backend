import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseService } from './firebase.service';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { FirebaseMessagingController } from './firebase-messaging.controller';

@Module({
  imports: [ConfigModule],
  controllers: [FirebaseMessagingController],
  providers: [FirebaseAdminProvider, FirebaseService, FirebaseMessagingService],
  exports: [FirebaseService, FirebaseAdminProvider, FirebaseMessagingService],
})
export class FirebaseModule {}
