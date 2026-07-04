import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseService } from './firebase.service';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseAdminProvider, FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
