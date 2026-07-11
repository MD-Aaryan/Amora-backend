import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { CreateSearchHistoryDto } from '../dto/search-history.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post('history')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a search keyword to history' })
  @ApiResponse({ status: 200, description: 'Search saved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async saveSearch(
    @GetUser('id') userId: string,
    @Body() dto: CreateSearchHistoryDto,
  ) {
    return this.historyService.saveSearch(userId, dto.keyword);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get search history (max 20, newest first, deduplicated)',
  })
  @ApiResponse({ status: 200, description: 'Search history returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getHistory(@GetUser('id') userId: string) {
    return this.historyService.getHistory(userId);
  }

  @Delete('history')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all search history' })
  @ApiResponse({ status: 200, description: 'Search history cleared.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteHistory(@GetUser('id') userId: string) {
    return this.historyService.deleteHistory(userId);
  }

  @Get('recent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent searches (last 10, newest first)' })
  @ApiResponse({ status: 200, description: 'Recent searches returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getRecent(@GetUser('id') userId: string) {
    return this.historyService.getRecent(userId);
  }

  @Delete('recent')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear recent searches' })
  @ApiResponse({ status: 200, description: 'Recent searches cleared.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteRecent(@GetUser('id') userId: string) {
    return this.historyService.deleteRecent(userId);
  }

  @Public()
  @Get('popular')
  @ApiOperation({
    summary:
      'Get popular searches - top keywords, categories, and trending tags',
  })
  @ApiResponse({ status: 200, description: 'Popular searches returned.' })
  async getPopular() {
    return this.historyService.getPopular();
  }
}
