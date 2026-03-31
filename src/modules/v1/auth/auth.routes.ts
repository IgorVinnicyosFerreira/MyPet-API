import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { makeAuthController } from './auth.factory';
import {
  authLoginBodySchema,
  authRegisterBodySchema,
  authTokenResponseSchema,
  authUserSchema,
} from './auth.schemas';

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/register',
    {
      schema: {
        body: authRegisterBodySchema,
        response: {
          201: authUserSchema,
        },
      },
    },
    (req, reply) => makeAuthController().register(req, reply),
  );

  fastify.post(
    '/login',
    {
      schema: {
        body: authLoginBodySchema,
        response: {
          200: authTokenResponseSchema,
        },
      },
    },
    (req, reply) => makeAuthController().login(req, reply),
  );
};

export { authRoutes };
