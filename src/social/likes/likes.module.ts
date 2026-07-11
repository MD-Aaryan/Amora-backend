import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { VideoModule } from '../../video/video.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { LikesRepository } from './likes.repository';

@Module({
  imports: [PrismaModule, VideoModule],
  controllers: [LikesController],
  providers: [LikesService, LikesRepository],
})
export class LikesModule {}
