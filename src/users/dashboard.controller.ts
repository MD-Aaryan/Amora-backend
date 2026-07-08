import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  @Get('home')
  async getHomeFeed(
    @GetUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getHomeFeed(userId, { page, limit });
  }

  @Get('recommended')
  async getRecommended(@GetUser('id') userId: string) {
    return this.usersService.getRecommendedVideos(userId);
  }

  @Get('trending')
  async getTrending() {
    return this.usersService.getTrendingVideos();
  }

  @Get('categories')
  async getCategories() {
    return this.usersService.getCategories();
  }
}
