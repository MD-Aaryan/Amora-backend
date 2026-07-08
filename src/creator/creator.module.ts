import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { UsersModule } from '../users/users.module';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { CreatorRepository } from './creator.repository';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CreatorController],
  providers: [CreatorService, CreatorRepository],
  exports: [CreatorService, CreatorRepository],
})
export class CreatorModule {}
