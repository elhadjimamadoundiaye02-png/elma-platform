import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Vérifie la présence et la validité de l'access token JWT (voir auth/strategies/jwt.strategy.ts)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
