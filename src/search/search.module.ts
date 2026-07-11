import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';
import { HistoryController } from './history/history.controller';
import { HistoryService } from './history/history.service';
import { HistoryRepository } from './history/history.repository';
import { DiscoveryController } from './discovery/discovery.controller';
import { DiscoveryService } from './discovery/discovery.service';
import { DiscoveryRepository } from './discovery/discovery.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController, HistoryController, DiscoveryController],
  providers: [
    SearchService,
    SearchRepository,
    HistoryService,
    HistoryRepository,
    DiscoveryService,
    DiscoveryRepository,
  ],
  exports: [SearchService],
})
export class SearchModule {}
