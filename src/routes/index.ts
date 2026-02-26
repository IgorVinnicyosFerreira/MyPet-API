import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { v1Routes } from './v1';

const apiRoutes: FastifyPluginAsyncZod = async (fastify, opts) => {
  fastify.get(
    '/healthcheck',
    {
      schema: {
        description: 'Check API availability.',
      },
    },
    (_, reply) => {
      reply.status(200).send('Ok');
    },
  );

  fastify.register(v1Routes, {
    prefix: '/v1',
  });
};

export { apiRoutes };
