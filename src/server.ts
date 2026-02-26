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

import { apiRoutes } from './routes';

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

app.register(apiRoutes);

const PORT = Number(process.env.PORT || 3333);

async function run() {
  await app.ready();

  await app
    .listen({
      port: PORT,
      host: process.env.HOST || '0.0.0.0',
    })
    .then(() => {
      console.log(`HTTP Server is running on http://localhost:${PORT}`);
      console.log(`Docs available at http://localhost:${PORT}/docs`);
    });
}

run();
