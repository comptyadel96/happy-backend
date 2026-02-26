import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import Redis from 'ioredis'; // TEMPORARILY DISABLED

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  // private redis: Redis; // TEMPORARILY DISABLED
  private isDisabled = true; // In-memory cache disabled

  async onModuleInit() {
    // REDIS TEMPORARILY DISABLED
    console.log('[Cache] Redis is temporarily disabled');
    // this.redis = new Redis({
    //   host: process.env.REDIS_HOST || 'localhost',
    //   port: parseInt(process.env.REDIS_PORT || '6379'),
    //   password: process.env.REDIS_PASSWORD,
    //   retryStrategy: (times) => {
    //     const delay = Math.min(times * 50, 2000);
    //     return delay;
    //   },
    // });

    // this.redis.on('error', (err) => {
    //   console.error('[Redis] Connection error:', err);
    // });

    // this.redis.on('connect', () => {
    //   console.log('[Redis] Connected');
    // });
  }

  async onModuleDestroy() {
    // await this.redis.quit(); // TEMPORARILY DISABLED
  }

  async get(key: string): Promise<string | null> {
    // REDIS TEMPORARILY DISABLED - returns null
    return null;
    // return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    // REDIS TEMPORARILY DISABLED - no-op
    return Promise.resolve();
    // if (ttl) {
    //   await this.redis.setex(key, ttl, value);
    // } else {
    //   await this.redis.set(key, value);
    // }
  }

  async del(key: string): Promise<void> {
    // REDIS TEMPORARILY DISABLED - no-op
    return Promise.resolve();
    // await this.redis.del(key);
  }

  async hget(hash: string, field: string): Promise<string | null> {
    // REDIS TEMPORARILY DISABLED - returns null
    return null;
    // return this.redis.hget(hash, field);
  }

  async hset(hash: string, field: string, value: string): Promise<void> {
    // REDIS TEMPORARILY DISABLED - no-op
    return Promise.resolve();
    // await this.redis.hset(hash, field, value);
  }

  async hdel(hash: string, field: string): Promise<void> {
    // REDIS TEMPORARILY DISABLED - no-op
    return Promise.resolve();
    // await this.redis.hdel(hash, field);
  }

  async incr(key: string): Promise<number> {
    // REDIS TEMPORARILY DISABLED - returns 0
    return 0;
    // return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    // REDIS TEMPORARILY DISABLED - no-op
    return Promise.resolve();
    // await this.redis.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    // REDIS TEMPORARILY DISABLED - returns empty array
    return [];
    // return this.redis.keys(pattern);
  }

  async flushdb(): Promise<void> {
    // REDIS TEMPORARILY DISABLED - no-op
    return Promise.resolve();
    // await this.redis.flushdb();
  }

  getClient(): any {
    // REDIS TEMPORARILY DISABLED - returns null
    return null;
    // return this.redis;
  }
}
