import type { FastifyInstance, FastifyRequest } from 'fastify';
import { type JwtPayload, verifyJwt } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import type { IAuthRepository } from '@/modules/v1/auth/repositories/auth-interfaces.repository';
import { PrismaAuthRepository } from '@/modules/v1/auth/repositories/prisma-auth.repository';
import { HttpError } from './error-handler';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export function registerAuthMiddleware(
  fastify: FastifyInstance,
  authRepository: IAuthRepository = new PrismaAuthRepository(prisma),
) {
  fastify.decorateRequest('user', undefined as unknown as JwtPayload);

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Missing bearer token');
    }

    const token = authorization.replace('Bearer ', '').trim();
    const payload = verifyJwt(token);

    if (!payload.sub) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid authentication token');
    }

    const user = await authRepository.findAuthContextById(payload.sub);

    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid authentication token');
    }

    request.user = {
      sub: user.id,
      email: user.email,
      role: user.isSuperAdmin ? 'SUPER_ADMIN' : 'USER',
      iat: payload.iat,
      exp: payload.exp,
    };
  });
}
