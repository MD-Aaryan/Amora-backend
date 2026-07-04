import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        success: false,
        message: 'Missing or invalid authorization header',
        error: {
          code: 'AUTH_MISSING_HEADER',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await this.firebaseService.verifyIdToken(token);
    request.firebaseUser = decodedToken;

    return true;
  }
}
