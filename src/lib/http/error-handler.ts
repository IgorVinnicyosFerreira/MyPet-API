import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const statusToCode: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'RESOURCE_NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
};

function mapError(error: unknown): {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details: Record<string, unknown>;
} {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const maybe = error as Record<string, unknown>;

    if (maybe.code === 'FST_ERR_VALIDATION') {
      return {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Invalid request payload',
        details: {
          validation: maybe.validation,
          validationContext: maybe.validationContext,
        },
      };
    }

    if (typeof maybe.statusCode === 'number') {
      const statusCode = maybe.statusCode;
      return {
        statusCode,
        code: statusToCode[statusCode] ?? 'INTERNAL_SERVER_ERROR',
        message: typeof maybe.message === 'string' ? maybe.message : 'Request failed',
        details: {},
      };
    }
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected internal error',
    details: {},
  };
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
    const mapped = mapError(error);
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    request.log.error(
      {
        traceId: request.id,
        context: 'http.error-handler',
        errorName,
        code: mapped.code,
        statusCode: mapped.statusCode,
      },
      mapped.message,
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const details = mapped.statusCode >= 500 && isProduction ? {} : mapped.details;

    return reply.status(mapped.statusCode).send({
      error: {
        code: mapped.code,
        message: mapped.message,
        details,
        traceId: request.id,
      },
    });
  });
}
