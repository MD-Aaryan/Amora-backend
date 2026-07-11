import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { CreatorModule } from '../creator/creator.module';
import { SalonModule } from '../salon/salon.module';
import { VideoModule } from '../video/video.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedRepository } from './feed.repository';

@Module({
  imports: [PrismaModule, CreatorModule, SalonModule, VideoModule],
  controllers: [FeedController],
  providers: [FeedService, FeedRepository],
  exports: [FeedService],
})
export class FeedModule {}
