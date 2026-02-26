import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4-mini';

const tutorsRoutes: FastifyPluginAsyncZod = async (fastify, opts) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: z.object({
        name: z.optional(z.string().check(z.minLength(3))),
      }),
      response: {
        200: z.string(),
      },
    },
    handler: (req, reply) => {
      reply.status(200).send('List tutors');
    },
  });
};
export { tutorsRoutes };
