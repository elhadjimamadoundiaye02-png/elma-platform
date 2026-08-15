import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface LiveSession {
  socketId: string;
  userId: string;
  nom: string;
  role: string;
  ip: string;
  page: string;
  connecteDepuis: number;
}

// Les sessions actives vivent dans Redis (pas en PostgreSQL) : elles sont éphémères
// par nature et doivent supporter une écriture à chaque changement de page sans
// alourdir la base relationnelle. TTL glissant de 5 min : une session sans heartbeat
// expire automatiquement (déconnexion silencieuse, crash navigateur, etc).
@Injectable()
export class SessionsService implements OnModuleDestroy {
  private redis: Redis;
  private readonly TTL_SECONDS = 300;

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST') || 'localhost',
      port: Number(this.config.get('REDIS_PORT')) || 6379,
    });
  }

  async upsert(session: LiveSession) {
    await this.redis.set(
      `session:${session.socketId}`,
      JSON.stringify(session),
      'EX',
      this.TTL_SECONDS,
    );
  }

  async touch(socketId: string, page?: string) {
    const raw = await this.redis.get(`session:${socketId}`);
    if (!raw) return null;
    const session: LiveSession = JSON.parse(raw);
    if (page) session.page = page;
    await this.upsert(session);
    return session;
  }

  async remove(socketId: string) {
    await this.redis.del(`session:${socketId}`);
  }

  async findAll(): Promise<LiveSession[]> {
    const keys = await this.redis.keys('session:*');
    if (keys.length === 0) return [];
    const values = await this.redis.mget(keys);
    return values.filter(Boolean).map((v) => JSON.parse(v as string));
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
