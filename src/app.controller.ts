import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { CacheService } from './cache/cache.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * GET: Health check endpoint
   * Returns a simple message confirming the API is running
   */
  @Get()
  @ApiOperation({
    summary: 'API health check',
    description: 'Simple endpoint to verify the API is running and responsive.',
  })
  @ApiProduces('text/plain')
  @ApiResponse({
    status: 200,
    description: 'API is running',
  })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * GET: Redis health check
   * Tests connection to Redis Cloud and returns status
   */
  @Get('health/redis')
  @ApiOperation({
    summary: 'Redis Cloud connection status',
    description:
      'Checks the connection to Redis Cloud and returns operational status. ' +
      'Used for monitoring cache layer availability.',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Redis connection check completed',
    schema: {
      example: {
        status: 'ok',
        redis: '✅ Connected to Redis Cloud',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Redis is unavailable (cache disabled)',
    schema: {
      example: {
        status: 'ok',
        redis: '❌ Redis unreachable',
      },
    },
  })
  async checkRedis(): Promise<{ status: string; redis: string }> {
    const ok = await this.cacheService.ping();
    return {
      status: ok ? 'ok' : 'degraded',
      redis: ok ? '✅ Connected to Redis Cloud' : '❌ Redis unreachable',
    };
  }
}
