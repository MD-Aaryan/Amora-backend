import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { VideoModule } from '../../video/video.module';
import { SavedController } from './saved.controller';
import { SavedService } from './saved.service';
import { SavedRepository } from './saved.repository';

@Module({
  imports: [PrismaModule, VideoModule],
  controllers: [SavedController],
  providers: [SavedService, SavedRepository],
})
export class SavedModule {}
