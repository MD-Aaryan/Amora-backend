import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardRepository } from './dashboard/dashboard.repository';
import { AdminUsersController } from './users/users.controller';
import { AdminUsersService } from './users/users.service';
import { AdminUsersRepository } from './users/users.repository';
import { AdminCreatorsController } from './creators/creators.controller';
import { AdminCreatorsService } from './creators/creators.service';
import { AdminCreatorsRepository } from './creators/creators.repository';
import { AdminSalonsController } from './salons/salons.controller';
import { AdminSalonsService } from './salons/salons.service';
import { AdminSalonsRepository } from './salons/salons.repository';
import { ModerationController } from './moderation/moderation.controller';
import { ModerationService } from './moderation/moderation.service';
import { ModerationRepository } from './moderation/moderation.repository';
import { AdminCategoriesController } from './categories/categories.controller';
import { AdminCategoriesService } from './categories/categories.service';
import { AdminCategoriesRepository } from './categories/categories.repository';
import { AdminReportsController } from './reports/reports.controller';
import { AdminReportsService } from './reports/reports.service';
import { AdminReportsRepository } from './reports/reports.repository';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [
    DashboardController,
    AdminUsersController,
    AdminCreatorsController,
    AdminSalonsController,
    ModerationController,
    AdminCategoriesController,
    AdminReportsController,
  ],
  providers: [
    DashboardService,
    DashboardRepository,
    AdminUsersService,
    AdminUsersRepository,
    AdminCreatorsService,
    AdminCreatorsRepository,
    AdminSalonsService,
    AdminSalonsRepository,
    ModerationService,
    ModerationRepository,
    AdminCategoriesService,
    AdminCategoriesRepository,
    AdminReportsService,
    AdminReportsRepository,
  ],
  exports: [],
})
export class AdminModule {}
