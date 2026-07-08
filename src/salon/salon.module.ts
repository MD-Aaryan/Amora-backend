import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { UsersModule } from '../users/users.module';
import { SalonController } from './salon.controller';
import { SalonService } from './salon.service';
import { SalonRepository } from './salon.repository';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [SalonController],
  providers: [SalonService, SalonRepository],
  exports: [SalonService, SalonRepository],
})
export class SalonModule {}
