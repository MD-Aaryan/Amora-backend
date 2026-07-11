import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SharesService } from './shares.service';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Shares')
@Public()
@Controller('videos')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post(':videoId/share')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Share a video - increments share counter and returns share URL',
  })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video to share',
  })
  @ApiResponse({
    status: 200,
    description: 'Share info returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async shareVideo(
    @GetUser('id') userId: string | undefined,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.sharesService.shareVideo(videoId, userId);
  }

  @Get(':videoId/share')
  @ApiOperation({
    summary: 'Get share info - share URL and current share count',
  })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video',
  })
  @ApiResponse({
    status: 200,
    description: 'Share info returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async getShareInfo(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.sharesService.getShareInfo(videoId);
  }
}
