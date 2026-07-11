import {
  Controller,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Likes')
@Controller('videos')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':videoId/like')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a video' })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video to like',
  })
  @ApiResponse({ status: 201, description: 'Video liked successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  @ApiResponse({ status: 409, description: 'Already liked.' })
  async likeVideo(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.likesService.likeVideo(userId, videoId);
  }

  @Delete(':videoId/like')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a video' })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video to unlike',
  })
  @ApiResponse({ status: 200, description: 'Video unliked successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Like not found.' })
  async unlikeVideo(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.likesService.unlikeVideo(userId, videoId);
  }
}
