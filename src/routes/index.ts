import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { authRoutes } from '@/modules/v1/auth/auth.routes';
import { careRelationsRoutes } from '@/modules/v1/care-relations/care-relations.routes';
import { digitalWalletsRoutes } from '@/modules/v1/digital-wallets/digital-wallets.routes';
import { filesRoutes } from '@/modules/v1/files/files.routes';
import { petsRoutes } from '@/modules/v1/pets/pets.routes';
import { prescriptionsRoutes } from '@/modules/v1/prescriptions/prescriptions.routes';
import { usersRoutes } from '@/modules/v1/users/users.routes';

const apiRoutes: FastifyPluginAsyncZod = async (fastify) => {
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

  fastify.register(authRoutes, {
    prefix: '/v1/auth',
  });

  fastify.register(petsRoutes, {
    prefix: '/v1/pets',
  });

  fastify.register(filesRoutes, {
    prefix: '/v1/files',
  });

  fastify.register(prescriptionsRoutes, {
    prefix: '/v1',
  });

  fastify.register(careRelationsRoutes, {
    prefix: '/v1',
  });

  fastify.register(digitalWalletsRoutes, {
    prefix: '/v1',
  });
};

export { apiRoutes };
