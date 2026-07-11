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
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up',
    description:
      'Creates a new account in Firebase Auth and PostgreSQL, sends an email verification link.',
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Account created. Verify email before logging in.',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already registered or validation failed.',
  })
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

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description:
      'Resends the email verification link to the given email address.',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, description: 'Verification email sent.' })
  @ApiResponse({ status: 400, description: 'Unable to process request.' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto.email);

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      data: null,
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends a password reset email to the given address.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  @ApiResponse({ status: 400, description: 'Unable to process request.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);

    return {
      success: true,
      message: 'We have sent a verification code to your email.',
      data: null,
      error: null,
    };
  }

  @Public()
  @Get('verify-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check email verification status',
    description: 'Checks whether a given email is verified in Firebase Auth.',
  })
  @ApiQuery({
    name: 'email',
    required: true,
    description: 'Email address to check',
  })
  @ApiResponse({ status: 200, description: 'Verification status retrieved.' })
  async verifyStatus(@Query() dto: VerifyStatusDto) {
    const result = await this.authService.getVerificationStatus(dto.email);

    return {
      success: true,
      message: 'Email verification status retrieved successfully',
      data: result,
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('generate-verification-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate verification link',
    description:
      'Generates a Firebase email verification link for the given email.',
  })
  @ApiBody({ type: GenerateLinkDto })
  @ApiResponse({ status: 200, description: 'Verification link generated.' })
  @ApiResponse({ status: 500, description: 'Failed to generate link.' })
  async generateVerificationLink(@Body() dto: GenerateLinkDto) {
    const link = await this.authService.generateEmailVerificationLink(
      dto.email,
    );

    return {
      success: true,
      message: 'Email verification link generated successfully',
      data: { link },
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('generate-password-reset-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate password reset link',
    description:
      'Generates a Firebase password reset link for the given email.',
  })
  @ApiBody({ type: GenerateLinkDto })
  @ApiResponse({ status: 200, description: 'Password reset link generated.' })
  @ApiResponse({ status: 500, description: 'Failed to generate link.' })
  async generatePasswordResetLink(@Body() dto: GenerateLinkDto) {
    const link = await this.authService.generatePasswordResetLink(dto.email);

    return {
      success: true,
      message: 'Password reset link generated successfully',
      data: { link },
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('firebase/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Firebase login',
    description:
      'Accepts a Firebase ID token, syncs the user, and returns access + refresh JWT tokens.',
  })
  @ApiBody({ type: FirebaseLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Tokens returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token or email not verified.',
  })
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

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Accepts a refresh token, rotates it, and returns new access + refresh tokens.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Revokes the provided refresh token session.',
  })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(@Body() dto: LogoutDto) {
    const result = await this.authService.logout(dto.refreshToken);

    return {
      success: true,
      message: result.message,
      data: null,
      error: null,
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my profile',
    description:
      "Returns the authenticated user's profile including roles and account info.",
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@GetUser('id') userId: string) {
    const profile = await this.authService.getProfile(userId);

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
      error: null,
    };
  }

  @Post('switch-role')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Switch active role',
    description:
      "Switches the user's active role and returns a new access token for that role.",
  })
  @ApiBody({ type: SwitchRoleDto })
  @ApiResponse({ status: 200, description: 'Active role switched.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Role not assigned to user.' })
  async switchRole(@GetUser('id') userId: string, @Body() dto: SwitchRoleDto) {
    const result = await this.authService.switchRole(userId, dto.role);

    return {
      success: true,
      message: `Active role switched to ${dto.role}`,
      data: result,
      error: null,
    };
  }

  @Post('assign-role')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign a role',
    description:
      'Assigns a new role (CREATOR or SALON) to the authenticated user.',
  })
  @ApiBody({ type: AssignRoleDto })
  @ApiResponse({ status: 200, description: 'Role assigned successfully.' })
  @ApiResponse({ status: 400, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Cannot self-assign ADMIN role.' })
  async assignRole(@GetUser('id') userId: string, @Body() dto: AssignRoleDto) {
    const result = await this.authService.assignRole(userId, dto.role);

    return {
      success: true,
      message: `Role ${dto.role} assigned successfully`,
      data: result,
      error: null,
    };
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete my account',
    description:
      "Permanently deletes the authenticated user's account from Firebase and soft-deletes from PostgreSQL.",
  })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteOwnAccount(@GetUser('id') userId: string) {
    await this.authService.deleteOwnAccount(userId);
    return {
      success: true,
      message: 'Account deleted successfully.',
      data: null,
      error: null,
    };
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(ActiveRoleGuard)
  @Delete('account/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete any user account (Admin)',
    description:
      "Admin-only: deletes any user's account from Firebase and soft-deletes from PostgreSQL.",
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'UUID of the user to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
  async deleteUserAccount(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.authService.deleteUserAccount(userId);
    return {
      success: true,
      message: 'User account deleted successfully.',
      data: null,
      error: null,
    };
  }
}
