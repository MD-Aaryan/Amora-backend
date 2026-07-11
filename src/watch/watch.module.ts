import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { WatchController } from './watch.controller';
import { WatchService } from './watch.service';
import { WatchRepository } from './watch.repository';

@Module({
  imports: [PrismaModule],
  controllers: [WatchController],
  providers: [WatchService, WatchRepository],
  exports: [WatchService],
})
export class WatchModule {}
