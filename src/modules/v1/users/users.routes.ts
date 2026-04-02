import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4-mini';
import { makeUsersController } from './users.factory';
import {
  errorEnvelopeSchema,
  userIdParamSchema,
  userListQuerySchema,
  userSchema,
  userUpdateBodySchema,
} from './users.schemas';

const usersRoutes: FastifyPluginAsyncZod = async (fastify, _opts) => {
  fastify.route({
    method: 'GET',
    url: '/',
    preHandler: fastify.authenticate,
    schema: {
      querystring: userListQuerySchema,
      response: {
        200: z.array(userSchema),
        401: errorEnvelopeSchema,
        403: errorEnvelopeSchema,
      },
    },
    handler: (req, reply) => makeUsersController().list(req, reply),
  });

  fastify.route({
    method: 'GET',
    url: '/:userId',
    preHandler: fastify.authenticate,
    schema: {
      params: userIdParamSchema,
      response: {
        200: userSchema,
        401: errorEnvelopeSchema,
        404: errorEnvelopeSchema,
      },
    },
    handler: (req, reply) => makeUsersController().getById(req, reply),
  });

  fastify.route({
    method: 'PATCH',
    url: '/:userId',
    preHandler: fastify.authenticate,
    schema: {
      params: userIdParamSchema,
      body: userUpdateBodySchema,
      response: {
        200: userSchema,
        401: errorEnvelopeSchema,
        403: errorEnvelopeSchema,
        404: errorEnvelopeSchema,
        409: errorEnvelopeSchema,
        422: errorEnvelopeSchema,
      },
    },
    handler: (req, reply) => makeUsersController().updateById(req, reply),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:userId',
    preHandler: fastify.authenticate,
    schema: {
      params: userIdParamSchema,
      response: {
        204: z.unknown(),
        401: errorEnvelopeSchema,
        403: errorEnvelopeSchema,
        404: errorEnvelopeSchema,
      },
    },
    handler: (req, reply) => makeUsersController().deleteById(req, reply),
  });
};
export { usersRoutes };
