import type { FastifyInstance } from 'fastify';
import { HttpError } from './error-handler';

type Bucket = {
  count: number;
  resetAt: number;
};

const bucketByKey = new Map<string, Bucket>();

export function registerRateLimit(
  app: FastifyInstance,
  max = 120,
  timeWindowMs = 60_000,
) {
  app.addHook('preHandler', async (request) => {
    const key = `${request.ip}:${request.routeOptions.url}`;
    const now = Date.now();
    const bucket = bucketByKey.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucketByKey.set(key, {
        count: 1,
        resetAt: now + timeWindowMs,
      });
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      throw new HttpError(429, 'TOO_MANY_REQUESTS', 'Rate limit exceeded');
    }
  });
}
