import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { makeCareRelationsController } from './care-relations.factory';
import {
  careRelationBodySchema,
  careRelationParamSchema,
  careRelationSchema,
} from './care-relations.schemas';

const careRelationsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/pets/:petId/care-relations',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: careRelationParamSchema,
        body: careRelationBodySchema,
        response: {
          201: careRelationSchema,
        },
      },
    },
    (req, reply) => makeCareRelationsController().create(req, reply),
  );
};

export { careRelationsRoutes };
