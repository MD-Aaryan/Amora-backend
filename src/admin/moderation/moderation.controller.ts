import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';

@ApiTags('Admin Video Moderation')
@ApiBearerAuth()
@Controller('admin/videos')
@Roles(RoleName.ADMIN)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  @ApiOperation({
    summary: 'List all videos',
    description:
      'Returns paginated list of videos with filters and cursor-based pagination.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filter by status (published, hidden, deleted, draft, processing)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'creatorName',
    required: false,
    description: 'Search by creator name, salon name, or video title',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order (newest, oldest, views)',
  })
  @ApiResponse({ status: 200, description: 'Videos retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listVideos(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('creatorName') creatorName?: string,
    @Query('sort') sort?: string,
  ) {
    return this.moderationService.listVideos({
      cursor,
      limit,
      status,
      categoryId,
      creatorName,
      sort,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get video by ID',
    description:
      'Returns detailed video information including creator and report details.',
  })
  @ApiParam({ name: 'id', required: true, description: 'UUID of the video' })
  @ApiResponse({ status: 200, description: 'Video retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async getVideoById(@Param('id', ParseUUIDPipe) id: string) {
    return this.moderationService.getVideoById(id);
  }

  @Patch(':id/hide')
  @ApiOperation({
    summary: 'Hide video',
    description: 'Hides a video from public view.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the video to hide',
  })
  @ApiResponse({ status: 200, description: 'Video hidden successfully' })
  @ApiResponse({ status: 400, description: 'Already hidden' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async hideVideo(@Param('id', ParseUUIDPipe) id: string) {
    return this.moderationService.hideVideo(id);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore video',
    description: 'Restores a hidden or deleted video back to published status.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the video to restore',
  })
  @ApiResponse({ status: 200, description: 'Video restored successfully' })
  @ApiResponse({ status: 400, description: 'Already published' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async restoreVideo(@Param('id', ParseUUIDPipe) id: string) {
    return this.moderationService.restoreVideo(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete video',
    description: 'Soft deletes a video. Videos are never permanently deleted.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the video to delete',
  })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({ status: 400, description: 'Already deleted' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async deleteVideo(@Param('id', ParseUUIDPipe) id: string) {
    return this.moderationService.softDeleteVideo(id);
  }
}
