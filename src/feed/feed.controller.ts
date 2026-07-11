import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedResponse } from './entities/feed-item.entity';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Feed')
@Public()
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get home feed - published, public videos from approved creators/salons, newest first',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor (base64-encoded createdAt_videoId)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (1-50)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Home feed returned successfully.',
    type: FeedResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid cursor format.' })
  async getHomeFeed(@Query() query: FeedQueryDto) {
    return this.feedService.getHomeFeed(query.cursor, query.limit);
  }

  @Get('latest')
  @ApiOperation({
    summary: 'Get latest feed - newest public videos from approved partners',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (1-50)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Latest feed returned successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid cursor format.' })
  async getLatestFeed(@Query() query: FeedQueryDto) {
    return this.feedService.getLatestFeed(query.cursor, query.limit);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get category feed - filter by category ID' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (1-50)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Category feed returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async getCategoryFeed(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: FeedQueryDto,
  ) {
    return this.feedService.getCategoryFeed(
      categoryId,
      query.cursor,
      query.limit,
    );
  }

  @Get('creator/:creatorId')
  @ApiOperation({
    summary:
      'Get creator feed - creator info + public videos from an approved creator',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (1-50)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Creator feed returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Creator not found.' })
  async getCreatorFeed(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Query() query: FeedQueryDto,
  ) {
    return this.feedService.getCreatorFeed(
      creatorId,
      query.cursor,
      query.limit,
    );
  }

  @Get('salon/:salonId')
  @ApiOperation({
    summary:
      'Get salon feed - salon info + public videos from an approved salon',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (1-50)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Salon feed returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Salon not found.' })
  async getSalonFeed(
    @Param('salonId', ParseUUIDPipe) salonId: string,
    @Query() query: FeedQueryDto,
  ) {
    return this.feedService.getSalonFeed(salonId, query.cursor, query.limit);
  }
}
