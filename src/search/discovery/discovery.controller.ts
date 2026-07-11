import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { SearchFilterDto } from '../dto/search-history.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Discovery')
@Public()
@Controller()
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('search/filter')
  @ApiOperation({
    summary:
      'Filter videos by keyword, category, language, creator, salon with sort options',
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category UUID',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Filter by language code (e.g. en)',
  })
  @ApiQuery({
    name: 'creatorId',
    required: false,
    description: 'Filter by creator UUID',
  })
  @ApiQuery({
    name: 'salonId',
    required: false,
    description: 'Filter by salon UUID',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order',
    enum: ['newest', 'oldest', 'most_viewed'],
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
  @ApiResponse({ status: 200, description: 'Filtered videos returned.' })
  async filterVideos(@Query() query: SearchFilterDto) {
    return this.discoveryService.filterVideos(query);
  }

  @Get('discover/categories')
  @ApiOperation({ summary: 'Browse all categories with video counts' })
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
  @ApiResponse({ status: 200, description: 'Categories returned.' })
  async discoverCategories(
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.discoveryService.discoverCategories(cursor, limit);
  }

  @Get('discover/creators')
  @ApiOperation({ summary: 'Browse approved creators with follower counts' })
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
  @ApiResponse({ status: 200, description: 'Creators returned.' })
  async discoverCreators(
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.discoveryService.discoverCreators(cursor, limit);
  }

  @Get('discover/salons')
  @ApiOperation({ summary: 'Browse approved salons with ratings' })
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
  @ApiResponse({ status: 200, description: 'Salons returned.' })
  async discoverSalons(
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.discoveryService.discoverSalons(cursor, limit);
  }

  @Get('discover/popular')
  @ApiOperation({ summary: 'Browse popular categories' })
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
  @ApiResponse({ status: 200, description: 'Popular categories returned.' })
  async discoverPopular(
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.discoveryService.discoverPopular(cursor, limit);
  }
}
