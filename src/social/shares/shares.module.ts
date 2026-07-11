import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { VideoModule } from '../../video/video.module';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { SharesRepository } from './shares.repository';

@Module({
  imports: [PrismaModule, VideoModule],
  controllers: [SharesController],
  providers: [SharesService, SharesRepository],
})
export class SharesModule {}
