import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4-mini';

const petsRoutes: FastifyPluginAsyncZod = async (fastify, opt) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: z.object({
        name: z.optional(z.string().check(z.minLength(2))),
      }),
      response: {
        200: z.string(),
      },
    },
    handler: (req, res) => {
      res.status(200).send('Pet list');
    },
  });
};

export { petsRoutes };
