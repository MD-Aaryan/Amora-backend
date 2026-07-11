import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { VideoModule } from '../../video/video.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';

@Module({
  imports: [PrismaModule, VideoModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
