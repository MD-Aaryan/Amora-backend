import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [UsersController, DashboardController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
