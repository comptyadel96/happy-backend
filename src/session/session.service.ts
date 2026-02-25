import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  childId?: string;
  deviceId?: string;
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(private cacheService: CacheService) {}

  async createSession(
    sessionId: string,
    sessionData: Omit<SessionData, 'createdAt' | 'expiresAt'>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const now = Date.now();
    const data: SessionData = {
      ...sessionData,
      createdAt: now,
      expiresAt: now + ttl * 1000,
    };

    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.cacheService.set(key, JSON.stringify(data), ttl);

    // Track sessions per user for invalidation
    const userKey = `${this.USER_SESSIONS_PREFIX}${sessionData.userId}`;
    await this.cacheService.hset(userKey, sessionId, Date.now().toString());
    await this.cacheService.expire(userKey, ttl);
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.cacheService.get(key);
    if (!data) return null;

    const session: SessionData = JSON.parse(data);
    if (session.expiresAt < Date.now()) {
      await this.cacheService.del(key);
      return null;
    }

    return session;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.cacheService.del(key);

    const userKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    await this.cacheService.hdel(userKey, sessionId);
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    const userKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessions = await this.cacheService.getClient().hkeys(userKey);

    for (const sessionId of sessions) {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      await this.cacheService.del(key);
    }

    await this.cacheService.del(userKey);
  }

  async renewSession(
    sessionId: string,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const now = Date.now();
    const updated: SessionData = {
      ...session,
      expiresAt: now + ttl * 1000,
    };

    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.cacheService.set(key, JSON.stringify(updated), ttl);
  }
}
