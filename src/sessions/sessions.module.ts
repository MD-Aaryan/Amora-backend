import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { SessionsService } from './sessions.service';

@Module({
  imports: [PrismaModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
