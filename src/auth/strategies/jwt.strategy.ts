import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  firebaseUid: string;
  roles: string[];
  activeRole: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid token payload',
        error: { code: 'AUTH_INVALID_TOKEN' },
      });
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException({
        success: false,
        message: 'User account not found or is deactivated',
        error: { code: 'AUTH_USER_INVALID' },
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
