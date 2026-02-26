import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { petsRoutes } from './pets';
import { tutorsRoutes } from './tutors';

const v1Routes: FastifyPluginAsyncZod = async (fastify, opts) => {
  fastify.register(tutorsRoutes, {
    prefix: '/tutors',
  });
  fastify.register(petsRoutes, {
    prefix: '/pets',
  });
};

export { v1Routes };
