import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Extrait l'utilisateur authentifié (injecté par JwtStrategy) depuis la requête
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
