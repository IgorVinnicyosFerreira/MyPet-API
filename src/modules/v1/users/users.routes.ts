import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4-mini';
import { makeUsersController } from './users.factory';
import { UserSchema } from './users.schemas';

const usersRoutes: FastifyPluginAsyncZod = async (fastify, _opts) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: z.object({
        name: z.optional(z.string().check(z.minLength(3))),
      }),
      response: {
        200: z.array(UserSchema),
      },
    },
    handler: (req, reply) => makeUsersController().list(req, reply),
  });
};
export { usersRoutes };
