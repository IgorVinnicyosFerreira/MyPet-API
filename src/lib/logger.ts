import type { FastifyInstance } from 'fastify';

type LogLevel = 'info' | 'error';

function writeStructuredLog(params: {
  level: LogLevel;
  message: string;
  traceId: string;
  context: string;
  extra?: Record<string, unknown>;
}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level: params.level,
    message: params.message,
    traceId: params.traceId,
    context: params.context,
    ...params.extra,
  };

  if (params.level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

export function registerRequestLogging(app: FastifyInstance) {
  app.addHook('onRequest', async (request) => {
    writeStructuredLog({
      level: 'info',
      message: 'Incoming request',
      traceId: request.id,
      context: 'http.request',
      extra: {
        method: request.method,
        url: request.url,
      },
    });
  });

  app.addHook('onResponse', async (request, reply) => {
    writeStructuredLog({
      level: reply.statusCode >= 400 ? 'error' : 'info',
      message: 'Request completed',
      traceId: request.id,
      context: 'http.response',
      extra: {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
      },
    });
  });
}
