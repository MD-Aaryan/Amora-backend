import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';

export const FIREBASE_ADMIN_PROVIDER = 'FIREBASE_ADMIN_PROVIDER';

export const FirebaseAdminProvider = {
  provide: FIREBASE_ADMIN_PROVIDER,
  useFactory: (configService: ConfigService): App => {
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
    let privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (getApps().length === 0) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    return getApp();
  },
  inject: [ConfigService],
};
