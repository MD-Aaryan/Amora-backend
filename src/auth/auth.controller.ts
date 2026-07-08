import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyStatusDto } from './dto/verify-status.dto';
import { GenerateLinkDto } from './dto/generate-link.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { RoleName } from '../common/enums/role.enum';
import { ActiveRoleGuard } from '../common/guards/active-role.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/signup
   * Creates a new user in Firebase Authentication and PostgreSQL,
   * sends an email verification link, and returns without issuing tokens.
   * The user must verify their email before logging in.
   */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto) {
    const result = await this.authService.signup({
      email: dto.email,
      password: dto.password,
      roles: dto.roles,
    });

    return {
      success: true,
      message: result.message,
      data: result,
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Resends the email verification link to the user's email address.
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto.email);

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      data: null,
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Checks the local database for the email, then sends a password-reset
   * action code to the user's email address.
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);

    return {
      success: true,
      message: 'We have sent a verification code to your email.',
      data: null,
      error: null,
    };
  }

  /**
   * GET /api/v1/auth/verify-status
   * Checks the verification status of a user's email in Firebase.
   */
  @Public()
  @Get('verify-status')
  @HttpCode(HttpStatus.OK)
  async verifyStatus(@Query() dto: VerifyStatusDto) {
    const result = await this.authService.getVerificationStatus(dto.email);

    return {
      success: true,
      message: 'Email verification status retrieved successfully',
      data: result,
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/generate-verification-link
   * Generates a safe email verification link.
   */
  @Public()
  @Post('generate-verification-link')
  @HttpCode(HttpStatus.OK)
  async generateVerificationLink(@Body() dto: GenerateLinkDto) {
    const link = await this.authService.generateEmailVerificationLink(dto.email);

    return {
      success: true,
      message: 'Email verification link generated successfully',
      data: { link },
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/generate-password-reset-link
   * Generates a password reset link.
   */
  @Public()
  @Post('generate-password-reset-link')
  @HttpCode(HttpStatus.OK)
  async generatePasswordResetLink(@Body() dto: GenerateLinkDto) {
    const link = await this.authService.generatePasswordResetLink(dto.email);

    return {
      success: true,
      message: 'Password reset link generated successfully',
      data: { link },
      error: null,
    };
  }


  /**
   * POST /api/v1/auth/firebase/login
   * Accepts a Firebase ID token, verifies it, syncs the user,
   * and returns Access + Refresh JWT tokens.
   */
  @Public()
  @Post('firebase/login')
  @HttpCode(HttpStatus.OK)
  async firebaseLogin(
    @Body() dto: FirebaseLoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.authService.firebaseLogin(
      dto.idToken,
      ip,
      userAgent,
    );

    return {
      success: true,
      message: 'Login successful',
      data: result,
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/refresh
   * Accepts a refresh token, rotates it, and returns new Access + Refresh tokens.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.authService.refreshTokens(
      dto.refreshToken,
      ip,
      userAgent,
    );

    return {
      success: true,
      message: 'Tokens refreshed successfully',
      data: result,
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/logout
   * Revokes the provided refresh token session.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    const result = await this.authService.logout(dto.refreshToken);

    return {
      success: true,
      message: result.message,
      data: null,
      error: null,
    };
  }

  /**
   * GET /api/v1/auth/me
   * Returns the authenticated user's profile.
   */
  @Get('me')
  async getProfile(@GetUser('id') userId: string) {
    const profile = await this.authService.getProfile(userId);

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/switch-role
   * Switches the user's active role and returns a new access token.
   */
  @Post('switch-role')
  @HttpCode(HttpStatus.OK)
  async switchRole(@GetUser('id') userId: string, @Body() dto: SwitchRoleDto) {
    const result = await this.authService.switchRole(userId, dto.role);

    return {
      success: true,
      message: `Active role switched to ${dto.role}`,
      data: result,
      error: null,
    };
  }

  /**
   * POST /api/v1/auth/assign-role
   * Assigns a new role to the user (CREATOR or SALON only).
   */
  @Post('assign-role')
  @HttpCode(HttpStatus.OK)
  async assignRole(@GetUser('id') userId: string, @Body() dto: AssignRoleDto) {
    const result = await this.authService.assignRole(userId, dto.role);

    return {
      success: true,
      message: `Role ${dto.role} assigned successfully`,
      data: result,
      error: null,
    };
  }

  /**
   * DELETE /api/v1/auth/account
   * Deletes the authenticated user's own account (Firebase + PostgreSQL).
   */
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteOwnAccount(@GetUser('id') userId: string) {
    await this.authService.deleteOwnAccount(userId);
    return {
      success: true,
      message: 'Account deleted successfully.',
      data: null,
      error: null,
    };
  }

  /**
   * DELETE /api/v1/auth/account/:userId
   * Admin-only: deletes any user's account (Firebase + PostgreSQL).
   */
  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Delete('account/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteUserAccount(@Param('userId') userId: string) {
    await this.authService.deleteUserAccount(userId);
    return {
      success: true,
      message: 'User account deleted successfully.',
      data: null,
      error: null,
    };
  }
}
