import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private isDisabled = false;

  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        console.warn('[Cache] REDIS_URL not configured, cache will be disabled');
        this.isDisabled = true;
        return;
      }

      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        this.isDisabled = true;
      });

      this.redis.on('connect', () => {
        console.log('[Redis] Connected successfully');
        this.isDisabled = false;
      });

      this.redis.on('reconnecting', () => {
        console.log('[Redis] Attempting to reconnect...');
      });

      // Test the connection
      const pong = await this.redis.ping();
      if (pong === 'PONG') {
        console.log('[Cache] Redis Cloud connected and ready');
      }
    } catch (error) {
      console.error('[Cache] Redis connection failed:', error instanceof Error ? error.message : error);
      this.isDisabled = true;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get(_key: string): Promise<string | null> {
    if (this.isDisabled) return null;
    return this.redis.get(_key);
  }

  async set(_key: string, _value: string, _ttl?: number): Promise<void> {
    if (this.isDisabled) return Promise.resolve();
    if (_ttl) {
      await this.redis.setex(_key, _ttl, _value);
    } else {
      await this.redis.set(_key, _value);
    }
  }

  async del(_key: string): Promise<void> {
    if (this.isDisabled) return Promise.resolve();
    await this.redis.del(_key);
  }

  async hget(_hash: string, _field: string): Promise<string | null> {
    if (this.isDisabled) return null;
    return this.redis.hget(_hash, _field);
  }

  async hset(_hash: string, _field: string, _value: string): Promise<void> {
    if (this.isDisabled) return Promise.resolve();
    await this.redis.hset(_hash, _field, _value);
  }

  async hdel(_hash: string, _field: string): Promise<void> {
    if (this.isDisabled) return Promise.resolve();
    await this.redis.hdel(_hash, _field);
  }

  async incr(_key: string): Promise<number> {
    if (this.isDisabled) return 0;
    return this.redis.incr(_key);
  }

  async expire(_key: string, _seconds: number): Promise<void> {
    if (this.isDisabled) return Promise.resolve();
    await this.redis.expire(_key, _seconds);
  }

  async ping(): Promise<boolean> {
    if (this.isDisabled) return false;
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async keys(_pattern: string): Promise<string[]> {
    if (this.isDisabled) return [];
    return this.redis.keys(_pattern);
  }

  async flushdb(): Promise<void> {
    if (this.isDisabled) return Promise.resolve();
    await this.redis.flushdb();
  }

  getClient(): any {
    return this.redis || null;
  }
}
