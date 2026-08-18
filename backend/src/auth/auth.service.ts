import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { telephone: dto.telephone }] },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email ou ce numéro.');
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
        role: Role.CLIENT,
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides.');

    const valid = await bcrypt.compare(dto.motDePasse, user.motDePasseHash);
    if (!valid) throw new UnauthorizedException('Identifiants invalides.');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) throw new UnauthorizedException('Refresh token invalide.');

    // Rotation : on invalide l'ancien refresh token en émettant un nouveau couple de tokens
    return this.issueTokens(user.id, user.email, user.role);
  }

  // Route de secours pour promouvoir le tout premier compte admin, en
  // l'absence d'accès Shell (réservé au plan payant Render). Protégée par
  // une clé secrète générée aléatoirement par Render (ADMIN_SETUP_KEY),
  // connue seulement dans le dashboard Render — jamais exposée côté client.
  async promoteToAdmin(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Aucun compte avec cet email.');
    return this.prisma.user.update({ where: { email }, data: { role: 'admin' } });
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async issueTokens(userId: string, email: string, role: string) {
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

  // OTP (SMS/WhatsApp) : à brancher sur Twilio / WhatsApp Business API.
  // Le code est généré, stocké dans Redis avec un TTL de 5 min (clé otp:{telephone}),
  // puis vérifié dans verifyOtp — non détaillé ici, dépend du provider retenu.
  async requestOtp(telephone: string) {
    return { message: `Code envoyé au ${telephone}` };
  }

  async verifyOtp(telephone: string, code: string) {
    return { message: 'Code vérifié' };
  }
}
