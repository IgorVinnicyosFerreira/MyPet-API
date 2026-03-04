import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { usersRoutes } from '@/modules/v1/users/users.routes';

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

  fastify.register(usersRoutes, {
    prefix: '/v1/users',
  });
};

export { apiRoutes };
