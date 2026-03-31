import type { FastifyInstance, FastifyRequest } from 'fastify';
import { type JwtPayload, verifyJwt } from '@/lib/auth/jwt';
import { HttpError } from './error-handler';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export function registerAuthMiddleware(fastify: FastifyInstance) {
  fastify.decorateRequest('user', undefined as unknown as JwtPayload);

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Missing bearer token');
    }

    const token = authorization.replace('Bearer ', '').trim();

    request.user = verifyJwt(token);
  });
}
