import { fastifyCors } from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { fastify } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { registerAuthMiddleware } from '@/lib/http/auth-middleware';
import { registerErrorHandler } from '@/lib/http/error-handler';
import { registerRateLimit } from '@/lib/http/rate-limit';
import { registerRequestLogging } from '@/lib/logger';
import { apiRoutes } from '@/routes';

export function buildApp() {
  const app = fastify().withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'MyPet API',
        description: 'API to monitor your pet`s health',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(ScalarApiReference, {
    routePrefix: '/docs',
  });

  registerAuthMiddleware(app);
  registerRequestLogging(app);
  registerRateLimit(app);
  registerErrorHandler(app);

  app.register(apiRoutes);

  return app;
}
