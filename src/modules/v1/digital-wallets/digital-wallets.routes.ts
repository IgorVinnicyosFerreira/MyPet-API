import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { makeDigitalWalletsController } from './digital-wallets.factory';
import {
  digitalWalletParamSchema,
  digitalWalletQuerySchema,
  digitalWalletSchema,
} from './digital-wallets.schemas';

const digitalWalletsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/pets/:petId/digital-wallet',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: digitalWalletParamSchema,
        querystring: digitalWalletQuerySchema,
        response: {
          200: digitalWalletSchema,
        },
      },
    },
    (req, reply) => makeDigitalWalletsController().generate(req, reply),
  );
};

export { digitalWalletsRoutes };
