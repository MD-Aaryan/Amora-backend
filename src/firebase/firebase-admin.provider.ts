import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { Logger } from '@nestjs/common';

export const FIREBASE_ADMIN_PROVIDER = 'FIREBASE_ADMIN_PROVIDER';
const logger = new Logger('FirebaseAdminProvider');

export const FirebaseAdminProvider = {
  provide: FIREBASE_ADMIN_PROVIDER,
  useFactory: (configService: ConfigService): App => {
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
    let privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      logger.error('Firebase configuration is incomplete. Please check your environment variables.');
      throw new Error('Firebase configuration missing: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
    }

    // Clean private key: remove surrounding quotes and convert escaped newlines
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
    privateKey = privateKey.replace(/\\n/g, '\n');

    const apps = getApps();
    if (apps.length === 0) {
      logger.log('Initializing Firebase Admin SDK default app');
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    logger.log('Firebase Admin SDK default app already initialized, returning existing instance');
    return getApp();
  },
  inject: [ConfigService],
};

