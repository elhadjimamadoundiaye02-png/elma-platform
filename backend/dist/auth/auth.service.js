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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const role_enum_1 = require("../common/enums/role.enum");
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async register(dto) {
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { telephone: dto.telephone }] },
        });
        if (existing) {
            throw new common_1.ConflictException('Un compte existe déjà avec cet email ou ce numéro.');
        }
        const motDePasseHash = await bcrypt.hash(dto.motDePasse, 12);
        const user = await this.prisma.user.create({
            data: {
                nom: dto.nom,
                prenom: dto.prenom,
                email: dto.email,
                telephone: dto.telephone,
                motDePasseHash,
                adresse: dto.adresse,
                role: role_enum_1.Role.CLIENT,
            },
        });
        return this.issueTokens(user.id, user.email, user.role);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            throw new common_1.UnauthorizedException('Identifiants invalides.');
        const valid = await bcrypt.compare(dto.motDePasse, user.motDePasseHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Identifiants invalides.');
        return this.issueTokens(user.id, user.email, user.role);
    }
    async refresh(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.refreshTokenHash)
            throw new common_1.UnauthorizedException();
        const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Refresh token invalide.');
        return this.issueTokens(user.id, user.email, user.role);
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });
    }
    async issueTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES') || '15m',
        });
        const refreshToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES') || '7d',
        });
        const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash },
        });
        return { accessToken, refreshToken };
    }
    async requestOtp(telephone) {
        return { message: `Code envoyé au ${telephone}` };
    }
    async verifyOtp(telephone, code) {
        return { message: 'Code vérifié' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map