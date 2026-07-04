import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string; // User UUID
  firebaseUid: string;
  roles: string[];
  activeRole: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  /**
   * Called by Passport after the JWT is verified.
   * Attaches user data + role info to request.user.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException({
        success: false,
        message: 'User account not found or is deactivated',
        error: {
          code: 'AUTH_USER_INVALID',
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      firebaseUid: user.firebase_uid,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      roles: payload.roles,
      activeRole: payload.activeRole,
    };
  }
}
