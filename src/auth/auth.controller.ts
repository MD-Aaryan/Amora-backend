import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { Public } from '../common/decorators/public.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async switchRole(
    @GetUser('id') userId: string,
    @Body() dto: SwitchRoleDto,
  ) {
    const result = await this.authService.switchRole(userId, dto.role);

    return {
      success: true,
      message: `Active role switched to ${dto.role}`,
      data: result,
      error: null,
    };
  }
}
