import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Root health check',
    description:
      'Returns a simple health check response to confirm the server is running.',
  })
  @ApiResponse({ status: 200, description: 'Server is running.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @SkipThrottle()
  @Get('health')
  @ApiOperation({
    summary: 'Detailed health check',
    description:
      'Returns application health including database, Firebase, and Cloudinary status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully.',
  })
  async getHealth() {
    return this.appService.getHealth();
  }
}
