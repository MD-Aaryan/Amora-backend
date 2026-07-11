import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  @Get('home')
  @ApiOperation({
    summary: 'Get home feed',
    description: 'Returns a personalized home feed for the authenticated user.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Home feed retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getHomeFeed(
    @GetUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getHomeFeed(userId, { page, limit });
  }

  @Get('recommended')
  @ApiOperation({
    summary: 'Get recommended videos',
    description:
      'Returns recommended videos based on user preferences and watch history.',
  })
  @ApiResponse({ status: 200, description: 'Recommended videos retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getRecommended(@GetUser('id') userId: string) {
    return this.usersService.getRecommendedVideos(userId);
  }

  @Get('trending')
  @ApiOperation({
    summary: 'Get trending videos',
    description: 'Returns trending/popular videos across the platform.',
  })
  @ApiResponse({ status: 200, description: 'Trending videos retrieved.' })
  async getTrending() {
    return this.usersService.getTrendingVideos();
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get categories',
    description: 'Returns all available video categories.',
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved.' })
  async getCategories() {
    return this.usersService.getCategories();
  }
}
