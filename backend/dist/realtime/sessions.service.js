"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let SessionsService = class SessionsService {
    constructor(config) {
        this.config = config;
        this.TTL_SECONDS = 300;
        this.redis = new ioredis_1.default({
            host: this.config.get('REDIS_HOST') || 'localhost',
            port: Number(this.config.get('REDIS_PORT')) || 6379,
        });
    }
    async upsert(session) {
        await this.redis.set(`session:${session.socketId}`, JSON.stringify(session), 'EX', this.TTL_SECONDS);
    }
    async touch(socketId, page) {
        const raw = await this.redis.get(`session:${socketId}`);
        if (!raw)
            return null;
        const session = JSON.parse(raw);
        if (page)
            session.page = page;
        await this.upsert(session);
        return session;
    }
    async remove(socketId) {
        await this.redis.del(`session:${socketId}`);
    }
    async findAll() {
        const keys = await this.redis.keys('session:*');
        if (keys.length === 0)
            return [];
        const values = await this.redis.mget(keys);
        return values.filter(Boolean).map((v) => JSON.parse(v));
    }
    onModuleDestroy() {
        this.redis.disconnect();
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map