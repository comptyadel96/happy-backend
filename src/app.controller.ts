import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CacheService } from './cache/cache.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** GET /health/redis — quick test that Redis is reachable */
  @Get('health/redis')
  async checkRedis(): Promise<{ status: string; redis: string }> {
    const ok = await this.cacheService.ping();
    return {
      status: ok ? 'ok' : 'error',
      redis: ok ? '✅ Connected to Redis Cloud' : '❌ Redis unreachable',
    };
  }
}
