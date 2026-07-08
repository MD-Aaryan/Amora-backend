import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RoleName } from '../common/enums/role.enum';
import { JwtPayload } from './strategies/jwt.strategy';
import { getAuth } from 'firebase-admin/auth';
import { FIREBASE_ADMIN_PROVIDER } from '../firebase/firebase-admin.provider';
import { Inject } from '@nestjs/common';
import { App } from 'firebase-admin/app';

const IDENTITY_TOOLKIT_BASE = 'https://identitytoolkit.googleapis.com/v1'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(FIREBASE_ADMIN_PROVIDER)
    private readonly firebaseAdmin: App,
  ) {}

  async signup(data: {
    email: string;
    password: string;
    displayName?: string;
    roles?: string[];
  }) {
    await this.ensureEmailNotTaken(data.email);

    const displayName = data.displayName || data.email.split('@')[0];

    const firebaseUser = await getAuth(this.firebaseAdmin).createUser({
      email: data.email,
      password: data.password,
      displayName,
    });

    if (data.roles && data.roles.length > 0) {
      const validRoles = data.roles.filter((r) =>
        ['CREATOR', 'SALON'].includes(r),
      );
      if (validRoles.length > 0) {
        await getAuth(this.firebaseAdmin).setCustomUserClaims(
          firebaseUser.uid,
          { selectedRoles: validRoles },
        );
      }
    }

    try {
      await this.sendVerificationEmail(data.email);

      return {
        email: data.email,
        emailVerified: false,
        roles: [RoleName.CUSTOMER, ...(data.roles?.filter((r) => ['CREATOR', 'SALON'].includes(r)) || [])],
        message:
          'Account created. Please check your inbox and verify your email before logging in.',
      };
    } catch (error) {
      await getAuth(this.firebaseAdmin)
        .deleteUser(firebaseUser.uid)
        .catch((cleanupErr) =>
          this.logger.error(
            `Failed to cleanup Firebase user ${firebaseUser.uid}: ${cleanupErr.message}`,
          ),
        );
      throw error;
    }
  }

  async firebaseLogin(idToken: string, ipAddress?: string, userAgent?: string) {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);

    if (
      decodedToken.firebase?.sign_in_provider === 'password' &&
      !decodedToken.email_verified
    ) {
      throw new UnauthorizedException({
        success: false,
        message: 'Please verify your email before logging in.',
        error: { code: 'AUTH_EMAIL_NOT_VERIFIED' },
      });
    }

    const selectedRoles: string[] = (decodedToken as any).selectedRoles || [];

    const user = await this.usersService.upsertByFirebaseUid({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      phone: decodedToken.phone_number,
      displayName: decodedToken.name || decodedToken.email?.split('@')[0],
      avatarUrl: decodedToken.picture,
      extraRoles: selectedRoles,
    });

    if (selectedRoles.length > 0) {
      await getAuth(this.firebaseAdmin).setCustomUserClaims(decodedToken.uid, {});
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

    await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
      expiresAt: refreshExpiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        emailVerified: true,
        roles: roleNames,
        activeRole,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const session = await this.sessionsService.findValidSession(refreshToken);

    if (!session) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid or expired refresh token',
        error: { code: 'AUTH_REFRESH_INVALID' },
      });
    }

    const user = session.user;
    if (!user.is_active) {
      throw new UnauthorizedException({
        success: false,
        message: 'User account is deactivated',
        error: { code: 'AUTH_USER_DEACTIVATED' },
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

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string) {
    await this.sessionsService.revokeSession(refreshToken);
    return { message: 'Logged out successfully' };
  }

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

    return { accessToken, activeRole: newRole };
  }

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

  async assignRole(userId: string, roleName: string) {
    if (roleName === RoleName.ADMIN) {
      throw new ForbiddenException({
        success: false,
        message: 'Cannot self-assign ADMIN role.',
        error: { code: 'AUTH_ROLE_NOT_ALLOWED' },
      });
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'User not found.',
        error: { code: 'AUTH_USER_NOT_FOUND' },
      });
    }

    const updatedUser = await this.usersService.assignRole(userId, roleName);
    if (!updatedUser) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to assign role.',
        error: { code: 'AUTH_ROLE_ASSIGN_FAILED' },
      });
    }

    const roleNames = this.usersService.extractRoleNames(updatedUser);

    return { roles: roleNames };
  }

  // ─── Email Verification (Generic messages to prevent enumeration) ─

  async generateEmailVerificationLink(email: string): Promise<string> {
    try {
      const actionCodeSettings = {
        url: `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/auth/email-verified`,
        handleCodeInApp: true,
      };
      return await getAuth(this.firebaseAdmin).generateEmailVerificationLink(
        email,
        actionCodeSettings,
      );
    } catch (error: any) {
      this.logger.error(`Failed to generate verification link: ${error.message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to generate verification link.',
        error: { code: 'AUTH_VERIFICATION_LINK_FAILED' },
      });
    }
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    try {
      const actionCodeSettings = {
        url: `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/signin`,
        handleCodeInApp: true,
      };
      return await getAuth(this.firebaseAdmin).generatePasswordResetLink(
        email,
        actionCodeSettings,
      );
    } catch (error: any) {
      this.logger.error(`Failed to generate password reset link: ${error.message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to generate password reset link.',
        error: { code: 'AUTH_RESET_LINK_FAILED' },
      });
    }
  }

  async sendVerificationEmail(email: string, password?: string): Promise<void> {
    try {
      const idToken = await this.getIdTokenForEmail(email, password);

      await this.callIdentityToolkit('accounts:sendOobCode', {
        requestType: 'VERIFY_EMAIL',
        idToken,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
        error: { code: 'AUTH_VERIFICATION_EMAIL_FAILED' },
      });
    }
  }

  async getVerificationStatus(email: string): Promise<{ emailVerified: boolean }> {
    try {
      const firebaseUser = await getAuth(this.firebaseAdmin).getUserByEmail(email);
      return { emailVerified: firebaseUser.emailVerified };
    } catch (error: any) {
      return { emailVerified: false };
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    try {
      await getAuth(this.firebaseAdmin).getUserByEmail(email);
    } catch {
      throw new BadRequestException({
        success: false,
        message: 'Unable to process request.',
        error: { code: 'AUTH_REQUEST_FAILED' },
      });
    }

    await this.sendVerificationEmail(email);
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await this.callIdentityToolkit('accounts:sendOobCode', {
        requestType: 'PASSWORD_RESET',
        email,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
        error: { code: 'AUTH_RESET_EMAIL_FAILED' },
      });
    }
  }

  // ─── Account Deletion ──────────────────────────────────────────

  async deleteOwnAccount(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'User not found.',
        error: { code: 'AUTH_USER_NOT_FOUND' },
      });
    }

    // Delete from Firebase Auth
    try {
      await getAuth(this.firebaseAdmin).deleteUser(user.firebase_uid);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        this.logger.error(`Failed to delete Firebase user: ${error.message}`);
        throw new InternalServerErrorException({
          success: false,
          message: 'Failed to delete account. Please try again.',
          error: { code: 'AUTH_FIREBASE_DELETE_FAILED' },
        });
      }
      this.logger.warn(`Firebase user already deleted, proceeding with DB cleanup`);
    }

    // Soft delete from PostgreSQL
    await this.usersService.softDeleteById(userId);
  }

  async deleteUserAccount(targetUserId: string) {
    const user = await this.usersService.findById(targetUserId);
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: 'User not found.',
        error: { code: 'AUTH_USER_NOT_FOUND' },
      });
    }

    try {
      await getAuth(this.firebaseAdmin).deleteUser(user.firebase_uid);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        this.logger.error(`Failed to delete Firebase user: ${error.message}`);
        throw new InternalServerErrorException({
          success: false,
          message: 'Failed to delete account. Please try again.',
          error: { code: 'AUTH_FIREBASE_DELETE_FAILED' },
        });
      }
      this.logger.warn(`Firebase user already deleted, proceeding with DB cleanup`);
    }

    await this.usersService.softDeleteById(targetUserId);
  }

  // ─── Private Helpers ─────────────────────────────────────────────

  private async ensureEmailNotTaken(email: string): Promise<void> {
    try {
      await getAuth(this.firebaseAdmin).getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return;
      }
      this.logger.error(`Email availability check failed: ${error.message}`);
      throw error;
    }
    throw new BadRequestException({
      success: false,
      message: 'Email already registered',
      error: { code: 'AUTH_EMAIL_EXISTS' },
    });
  }

  private getFirebaseApiKey(): string {
    const apiKey = this.configService.get<string>('FIREBASE_WEB_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Firebase Web API key not configured.',
        error: { code: 'AUTH_CONFIG_MISSING' },
      });
    }
    return apiKey;
  }

  private async callIdentityToolkit(endpoint: string, body: Record<string, any>): Promise<any> {
    const apiKey = this.getFirebaseApiKey();
    const res = await fetch(
      `${IDENTITY_TOOLKIT_BASE}/${endpoint}?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Firebase API error: ${endpoint}`);
    }
    return data;
  }

  private async getIdTokenForEmail(email: string, password?: string): Promise<string> {
    if (password) {
      const data = await this.callIdentityToolkit('accounts:signInWithPassword', {
        email,
        password,
        returnSecureToken: true,
      });
      return data.idToken;
    }

    const firebaseUser = await getAuth(this.firebaseAdmin).getUserByEmail(email);
    const customToken = await getAuth(this.firebaseAdmin).createCustomToken(firebaseUser.uid);
    const data = await this.callIdentityToolkit('accounts:signInWithCustomToken', {
      token: customToken,
      returnSecureToken: true,
    });
    return data.idToken;
  }

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
