import {
  Controller,
  Get,
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
} from '@nestjs/swagger';
import { SavedService } from './saved.service';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Saved Videos')
@Controller('users')
export class SavedController {
  constructor(private readonly savedService: SavedService) {}

  @Get('saved')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user saved videos list' })
  @ApiResponse({
    status: 200,
    description: 'Saved videos returned successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getSavedVideos(@GetUser('id') userId: string) {
    return this.savedService.getSavedVideos(userId);
  }

  @Post('saved/:videoId')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a video' })
  @ApiResponse({ status: 201, description: 'Video saved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  @ApiResponse({ status: 409, description: 'Already saved.' })
  async saveVideo(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.savedService.saveVideo(userId, videoId);
  }

  @Delete('saved/:videoId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a saved video' })
  @ApiResponse({
    status: 200,
    description: 'Saved video removed successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Saved video not found.' })
  async removeSaved(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.savedService.removeSaved(userId, videoId);
  }
}
