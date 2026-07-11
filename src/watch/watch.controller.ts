import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WatchService } from './watch.service';
import { UpdateWatchHistoryDto } from './dto/update-watch-history.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';

@ApiTags('Watch')
@Controller('watch')
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':videoId')
  @ApiOperation({
    summary:
      'Watch a video - returns video details, creator/salon info, and related videos',
  })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video to watch',
  })
  @ApiResponse({
    status: 200,
    description: 'Video details returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async watchVideo(
    @GetUser('id') userId: string | undefined,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.watchService.watchVideo(videoId, userId);
  }

  @Public()
  @Get(':videoId/related')
  @ApiOperation({
    summary:
      'Get related videos - same category, exclude current, max 10, newest first',
  })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the source video',
  })
  @ApiResponse({
    status: 200,
    description: 'Related videos returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async getRelatedVideos(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.watchService.getRelatedVideos(videoId);
  }

  @Post('history')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update watch progress - update position, duration, and completion status',
  })
  @ApiResponse({
    status: 200,
    description: 'Watch history updated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Watch history not found.' })
  @HttpCode(HttpStatus.OK)
  async updateWatchHistory(
    @GetUser('id') userId: string,
    @Body() dto: UpdateWatchHistoryDto,
  ) {
    return this.watchService.updateWatchHistory(userId, dto);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user watch history - list of watched videos with progress',
  })
  @ApiResponse({
    status: 200,
    description: 'Watch history returned successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getWatchHistory(@GetUser('id') userId: string) {
    return this.watchService.getWatchHistory(userId);
  }

  @Delete('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear user watch history' })
  @ApiResponse({
    status: 200,
    description: 'Watch history cleared successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @HttpCode(HttpStatus.OK)
  async clearWatchHistory(@GetUser('id') userId: string) {
    return this.watchService.clearWatchHistory(userId);
  }
}
