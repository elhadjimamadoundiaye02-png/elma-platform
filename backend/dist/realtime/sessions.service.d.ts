import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface LiveSession {
    socketId: string;
    userId: string;
    nom: string;
    role: string;
    ip: string;
    page: string;
    connecteDepuis: number;
}
export declare class SessionsService implements OnModuleDestroy {
    private config;
    private redis;
    private readonly TTL_SECONDS;
    constructor(config: ConfigService);
    upsert(session: LiveSession): Promise<void>;
    touch(socketId: string, page?: string): Promise<LiveSession | null>;
    remove(socketId: string): Promise<void>;
    findAll(): Promise<LiveSession[]>;
    onModuleDestroy(): void;
}
