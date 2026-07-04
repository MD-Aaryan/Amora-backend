import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RoleName } from '../common/enums/role.enum';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Firebase Login Flow:
   * 1. Verify the Firebase ID token
   * 2. Upsert the user in PostgreSQL (create with CUSTOMER role if new)
   * 3. Generate Access + Refresh JWT pair
   * 4. Store the hashed refresh token in the sessions table
   */
  async firebaseLogin(
    idToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Step 1: Verify Firebase token
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);

    // Step 2: Upsert user in PostgreSQL
    const user = await this.usersService.upsertByFirebaseUid({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      phone: decodedToken.phone_number,
      displayName: decodedToken.name || decodedToken.email?.split('@')[0],
      avatarUrl: decodedToken.picture,
    });

    const roleNames = this.usersService.extractRoleNames(user);
    const activeRole = roleNames[0] || RoleName.CUSTOMER;

    // Step 3: Generate token pair
    const tokens = await this.generateTokenPair({
      sub: user.id,
      firebaseUid: user.firebase_uid,
      roles: roleNames,
      activeRole,
    });

    // Step 4: Store hashed refresh token
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

    await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
      expiresAt: refreshExpiresAt,
    });

    this.logger.log(`User ${user.id} logged in successfully`);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        roles: roleNames,
        activeRole,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Refresh Token Flow:
   * 1. Find valid session by hashed refresh token
   * 2. Rotate: revoke old token, issue new pair
   * 3. Store new hashed refresh token
   */
  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const session =
      await this.sessionsService.findValidSession(refreshToken);

    if (!session) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid or expired refresh token',
        error: {
          code: 'AUTH_REFRESH_INVALID',
        },
      });
    }

    const user = session.user;
    if (!user.is_active) {
      throw new UnauthorizedException({
        success: false,
        message: 'User account is deactivated',
        error: {
          code: 'AUTH_USER_DEACTIVATED',
        },
      });
    }

    const roleNames = this.usersService.extractRoleNames(user);
    const activeRole = roleNames[0] || RoleName.CUSTOMER;

    const tokens = await this.generateTokenPair({
      sub: user.id,
      firebaseUid: user.firebase_uid,
      roles: roleNames,
      activeRole,
    });

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

    await this.sessionsService.rotateRefreshToken({
      oldRefreshToken: refreshToken,
      newRefreshToken: tokens.refreshToken,
      userId: user.id,
      ipAddress,
      userAgent,
      expiresAt: refreshExpiresAt,
    });

    this.logger.log(`Tokens refreshed for user ${user.id}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout: revoke the specific refresh token session.
   */
  async logout(refreshToken: string) {
    await this.sessionsService.revokeSession(refreshToken);
    return { message: 'Logged out successfully' };
  }

  /**
   * Switch active role: verify the user has the requested role, then
   * issue a new access token with the updated activeRole claim.
   */
  async switchRole(userId: string, newRole: RoleName) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not found',
        error: { code: 'AUTH_USER_NOT_FOUND' },
      });
    }

    const roleNames = this.usersService.extractRoleNames(user);
    if (!roleNames.includes(newRole)) {
      throw new ForbiddenException({
        success: false,
        message: `You do not have the ${newRole} role assigned`,
        error: { code: 'AUTH_ROLE_NOT_ASSIGNED' },
      });
    }

    const payload: JwtPayload = {
      sub: user.id,
      firebaseUid: user.firebase_uid,
      roles: roleNames,
      activeRole: newRole,
    };

    const accessToken = await this.generateAccessToken(payload);

    this.logger.log(`User ${user.id} switched active role to ${newRole}`);

    return {
      accessToken,
      activeRole: newRole,
    };
  }

  /**
   * Get the authenticated user's profile (from /auth/me).
   */
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not found',
        error: { code: 'AUTH_USER_NOT_FOUND' },
      });
    }

    const roleNames = this.usersService.extractRoleNames(user);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      roles: roleNames,
      createdAt: user.created_at,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private async generateTokenPair(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);
    return { accessToken, refreshToken };
  }

  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  private async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(
      { sub: payload.sub },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );
  }
}
