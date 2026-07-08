import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Profile ─────────────────────────────────────────────────────

  @Get('me')
  async getProfile(@GetUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  async updateProfile(@GetUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@GetUser('id') userId: string) {
    await this.usersService.deleteAccount(userId);
    return { message: 'Account deactivated successfully.' };
  }

  // Static routes must be declared BEFORE parameterized :id
  @Get('public/:username')
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfileByUsername(username);
  }

  // ─── Avatar ──────────────────────────────────────────────────────

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAvatar(
    @GetUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(userId, file);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@GetUser('id') userId: string) {
    await this.usersService.deleteAvatar(userId);
    return { message: 'Avatar removed successfully.' };
  }

  // ─── Saved Videos ────────────────────────────────────────────────

  @Get('saved')
  async getSavedVideos(@GetUser('id') userId: string) {
    return this.usersService.getSavedVideos(userId);
  }

  @Post('saved/:videoId')
  async saveVideo(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.usersService.saveVideo(userId, videoId);
  }

  @Delete('saved/:videoId')
  @HttpCode(HttpStatus.OK)
  async unsaveVideo(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    await this.usersService.unsaveVideo(userId, videoId);
    return { message: 'Video removed from saved.' };
  }

  // ─── Watch History ───────────────────────────────────────────────

  @Get('history')
  async getWatchHistory(@GetUser('id') userId: string) {
    return this.usersService.getWatchHistory(userId);
  }

  @Post('history')
  async recordWatch(
    @GetUser('id') userId: string,
    @Body() body: { videoId: string; lastPosition?: number; completed?: boolean },
  ) {
    return this.usersService.recordWatch(userId, body.videoId, body.lastPosition, body.completed);
  }

  @Delete('history')
  @HttpCode(HttpStatus.OK)
  async clearWatchHistory(@GetUser('id') userId: string) {
    await this.usersService.clearWatchHistory(userId);
    return { message: 'Watch history cleared.' };
  }

  // ─── Liked Videos ────────────────────────────────────────────────

  @Get('liked')
  async getLikedVideos(@GetUser('id') userId: string) {
    return this.usersService.getLikedVideos(userId);
  }

  // ─── Following ───────────────────────────────────────────────────

  @Get('following')
  async getFollowing(@GetUser('id') userId: string) {
    return this.usersService.getFollowing(userId);
  }

  @Post('follow/:creatorId')
  async follow(
    @GetUser('id') userId: string,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    return this.usersService.follow(userId, creatorId);
  }

  @Delete('unfollow/:creatorId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @GetUser('id') userId: string,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    await this.usersService.unfollow(userId, creatorId);
    return { message: 'Unfollowed successfully.' };
  }

  // Parameterized :id must be declared AFTER all static routes
  @Get(':id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
