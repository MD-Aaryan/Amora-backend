import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchQueryDto,
  SearchVideoQueryDto,
  SearchCreatorQueryDto,
  SearchSalonQueryDto,
  SearchCategoryQueryDto,
  SearchTagQueryDto,
  SearchSuggestionsQueryDto,
} from './dto/search-query.dto';
import {
  GlobalSearchResponse,
  SearchVideoResponse,
  SearchCreatorResponse,
  SearchSalonResponse,
  SearchCategoryResponse,
  SearchTagResponse,
  SearchSuggestionsResponse,
} from './entities/search-result.entity';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Search')
@Public()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary:
      'Global search - searches videos, creators, salons, and categories simultaneously',
  })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Search keyword (min 2 chars)',
    example: 'nail art',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per section (1-50)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Global search results returned.',
    type: GlobalSearchResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid keyword or cursor.' })
  async globalSearch(@Query() query: SearchQueryDto) {
    return this.searchService.globalSearch(
      query.keyword,
      query.cursor,
      query.limit,
    );
  }

  @Get('videos')
  @ApiOperation({
    summary:
      'Search videos by keyword - searches title, description, tags, category, creator name',
  })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Search keyword (min 2 chars)',
    example: 'hair tutorial',
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
    description: 'Video search results returned.',
    type: SearchVideoResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid keyword or cursor.' })
  async searchVideos(@Query() query: SearchVideoQueryDto) {
    return this.searchService.searchVideos(
      query.keyword,
      query.cursor,
      query.limit,
    );
  }

  @Get('creators')
  @ApiOperation({
    summary: 'Search creators by keyword - searches name, username, bio',
  })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Search keyword (min 2 chars)',
    example: 'stylist',
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
    description: 'Creator search results returned.',
    type: SearchCreatorResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid keyword or cursor.' })
  async searchCreators(@Query() query: SearchCreatorQueryDto) {
    return this.searchService.searchCreators(
      query.keyword,
      query.cursor,
      query.limit,
    );
  }

  @Get('salons')
  @ApiOperation({
    summary:
      'Search salons by keyword - searches name, owner name, address, description',
  })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Search keyword (min 2 chars)',
    example: 'downtown salon',
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
    description: 'Salon search results returned.',
    type: SearchSalonResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid keyword or cursor.' })
  async searchSalons(@Query() query: SearchSalonQueryDto) {
    return this.searchService.searchSalons(
      query.keyword,
      query.cursor,
      query.limit,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Search categories by keyword' })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Search keyword (min 2 chars)',
    example: 'nail',
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
    description: 'Category search results returned.',
    type: SearchCategoryResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid keyword or cursor.' })
  async searchCategories(@Query() query: SearchCategoryQueryDto) {
    return this.searchService.searchCategories(
      query.keyword,
      query.cursor,
      query.limit,
    );
  }

  @Get('tags')
  @ApiOperation({ summary: 'Search tags by keyword' })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Search keyword (min 2 chars)',
    example: 'nail',
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
    description: 'Tag search results returned.',
    type: SearchTagResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid keyword or cursor.' })
  async searchTags(@Query() query: SearchTagQueryDto) {
    return this.searchService.searchTags(
      query.keyword,
      query.cursor,
      query.limit,
    );
  }

  @Get('suggestions')
  @ApiOperation({
    summary:
      'Get search suggestions - lightweight keyword suggestions from videos, creators, salons, categories',
  })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Search keyword (min 2 chars)',
    example: 'nail',
  })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions returned (max 10).',
    type: SearchSuggestionsResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid keyword.' })
  async getSuggestions(@Query() query: SearchSuggestionsQueryDto) {
    return this.searchService.getSuggestions(query.keyword);
  }
}
