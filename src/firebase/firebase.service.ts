import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { FIREBASE_ADMIN_PROVIDER } from './firebase-admin.provider';

@Injectable()
export class FirebaseService {
  constructor(
    @Inject(FIREBASE_ADMIN_PROVIDER)
    private readonly firebaseAdmin: App,
  ) {}

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await getAuth(this.firebaseAdmin).verifyIdToken(idToken);
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid Firebase ID token',
        error: {
          code: 'AUTH_INVALID_TOKEN',
          details: error.message,
        },
      });
    }
  }
}
