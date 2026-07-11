import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    const checks: Record<string, string> = {};
    let overallStatus = 'healthy';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'connected';
    } catch (error) {
      checks.database = 'disconnected';
      overallStatus = 'degraded';
      this.logger.error(`Health check: database ${error}`);
    }

    checks.firebase = this.configService.get('FIREBASE_PROJECT_ID')
      ? 'configured'
      : 'not configured';

    checks.cloudinary = this.configService.get('CLOUDINARY_CLOUD_NAME')
      ? 'configured'
      : 'not configured';

    return {
      status: overallStatus,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };
  }
}
