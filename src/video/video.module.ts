import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CreatorModule } from '../creator/creator.module';
import { SalonModule } from '../salon/salon.module';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { VideoRepository } from './video.repository';

@Module({
  imports: [PrismaModule, CloudinaryModule, CreatorModule, SalonModule],
  controllers: [VideoController],
  providers: [VideoService, VideoRepository],
  exports: [VideoService, VideoRepository],
})
export class VideoModule {}
