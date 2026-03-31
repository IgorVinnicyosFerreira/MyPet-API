import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { MAX_UPLOAD_BODY_LIMIT_BYTES } from './files.constants';
import { makeFilesController } from './files.factory';
import { storedFileSchema, uploadFileBodySchema } from './files.schemas';

const filesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/uploads',
    {
      bodyLimit: MAX_UPLOAD_BODY_LIMIT_BYTES,
      preHandler: fastify.authenticate,
      schema: {
        body: uploadFileBodySchema,
        response: {
          201: storedFileSchema,
        },
      },
    },
    (req, reply) => makeFilesController().upload(req, reply),
  );
};

export { filesRoutes };
