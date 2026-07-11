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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get my profile',
    description:
      "Returns the authenticated user's full profile including roles.",
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getProfile(@GetUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my profile',
    description: "Updates the authenticated user's profile fields.",
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Username already taken.' })
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete my account',
    description: "Soft-deletes the authenticated user's account.",
  })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteAccount(@GetUser('id') userId: string) {
    await this.usersService.deleteAccount(userId);
    return { message: 'Account deactivated successfully.' };
  }

  @Get('public/:username')
  @ApiOperation({
    summary: 'Get public profile by username',
    description: 'Returns a minimal public profile for the given username.',
  })
  @ApiParam({
    name: 'username',
    required: true,
    description: 'Unique username of the user',
  })
  @ApiResponse({ status: 200, description: 'Public profile retrieved.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfileByUsername(username);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({
    summary: 'Upload avatar',
    description:
      'Uploads a new profile avatar image (JPEG, PNG, GIF, WebP, max 5MB).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
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
  @ApiOperation({
    summary: 'Delete avatar',
    description:
      "Removes the authenticated user's avatar and resets to default.",
  })
  @ApiResponse({ status: 200, description: 'Avatar removed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteAvatar(@GetUser('id') userId: string) {
    await this.usersService.deleteAvatar(userId);
    return { message: 'Avatar removed successfully.' };
  }

  @Get('saved')
  @ApiOperation({
    summary: 'Get saved videos',
    description: 'Returns the list of videos saved by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Saved videos retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getSavedVideos(@GetUser('id') userId: string) {
    return this.usersService.getSavedVideos(userId);
  }

  @Post('saved/:videoId')
  @ApiOperation({
    summary: 'Save a video',
    description: "Saves a video to the authenticated user's saved list.",
  })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video to save',
  })
  @ApiResponse({ status: 201, description: 'Video saved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async saveVideo(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.usersService.saveVideo(userId, videoId);
  }

  @Delete('saved/:videoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unsave a video',
    description: "Removes a video from the authenticated user's saved list.",
  })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video to remove',
  })
  @ApiResponse({ status: 200, description: 'Video removed from saved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Saved video not found.' })
  async unsaveVideo(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    await this.usersService.unsaveVideo(userId, videoId);
    return { message: 'Video removed from saved.' };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get watch history',
    description: "Returns the authenticated user's watch history.",
  })
  @ApiResponse({ status: 200, description: 'Watch history retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getWatchHistory(@GetUser('id') userId: string) {
    return this.usersService.getWatchHistory(userId);
  }

  @Post('history')
  @ApiOperation({
    summary: 'Record watch',
    description: 'Records or updates watch progress for a video.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['videoId'],
      properties: {
        videoId: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the video',
        },
        lastPosition: {
          type: 'number',
          description: 'Last watch position in seconds',
        },
        completed: {
          type: 'boolean',
          description: 'Whether the video was completed',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Watch recorded.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async recordWatch(
    @GetUser('id') userId: string,
    @Body()
    body: { videoId: string; lastPosition?: number; completed?: boolean },
  ) {
    return this.usersService.recordWatch(
      userId,
      body.videoId,
      body.lastPosition,
      body.completed,
    );
  }

  @Delete('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear watch history',
    description: "Clears the authenticated user's entire watch history.",
  })
  @ApiResponse({ status: 200, description: 'Watch history cleared.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async clearWatchHistory(@GetUser('id') userId: string) {
    await this.usersService.clearWatchHistory(userId);
    return { message: 'Watch history cleared.' };
  }

  @Get('liked')
  @ApiOperation({
    summary: 'Get liked videos',
    description: 'Returns the list of videos liked by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Liked videos retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getLikedVideos(@GetUser('id') userId: string) {
    return this.usersService.getLikedVideos(userId);
  }

  @Get('following')
  @ApiOperation({
    summary: 'Get following list',
    description: 'Returns the list of users the authenticated user follows.',
  })
  @ApiResponse({ status: 200, description: 'Following list retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getFollowing(@GetUser('id') userId: string) {
    return this.usersService.getFollowing(userId);
  }

  @Post('follow/:creatorId')
  @ApiOperation({
    summary: 'Follow a user',
    description: 'Follows another user by their UUID.',
  })
  @ApiParam({
    name: 'creatorId',
    required: true,
    description: 'UUID of the user to follow',
  })
  @ApiResponse({ status: 201, description: 'Followed successfully.' })
  @ApiResponse({ status: 400, description: 'Cannot follow yourself.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async follow(
    @GetUser('id') userId: string,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    return this.usersService.follow(userId, creatorId);
  }

  @Delete('unfollow/:creatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unfollow a user',
    description: 'Unfollows a previously followed user.',
  })
  @ApiParam({
    name: 'creatorId',
    required: true,
    description: 'UUID of the user to unfollow',
  })
  @ApiResponse({ status: 200, description: 'Unfollowed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Follow not found.' })
  async unfollow(
    @GetUser('id') userId: string,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    await this.usersService.unfollow(userId, creatorId);
    return { message: 'Unfollowed successfully.' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a public profile for the user with the given UUID.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the user' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
