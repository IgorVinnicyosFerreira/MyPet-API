import { randomUUID } from 'node:crypto';
import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';

type InjectJsonOptions = Omit<InjectOptions, 'remoteAddress'>;

let requestCount = 1;

function nextRemoteAddress() {
  const suffix = (requestCount % 200) + 1;
  requestCount += 1;
  return `127.0.0.${suffix}`;
}

export async function injectJson(
  app: FastifyInstance,
  options: InjectJsonOptions,
): Promise<LightMyRequestResponse> {
  return app.inject({
    ...options,
    remoteAddress: nextRemoteAddress(),
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

export async function createAuthSession(
  app: FastifyInstance,
  overrides?: {
    name?: string;
    email?: string;
    password?: string;
  },
) {
  const password = overrides?.password || 'password123';
  const email = overrides?.email || `user-${randomUUID()}@example.com`;

  const registerResponse = await injectJson(app, {
    method: 'POST',
    url: '/v1/auth/register',
    payload: {
      name: overrides?.name || 'User Test',
      email,
      password,
    },
  });

  if (registerResponse.statusCode !== 201) {
    throw new Error(`register failed: ${registerResponse.body}`);
  }

  const loginResponse = await injectJson(app, {
    method: 'POST',
    url: '/v1/auth/login',
    payload: {
      email,
      password,
    },
  });

  if (loginResponse.statusCode !== 200) {
    throw new Error(`login failed: ${loginResponse.body}`);
  }

  const loginBody = loginResponse.json() as {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };

  return {
    token: loginBody.token,
    user: loginBody.user,
    email,
    password,
  };
}

export function bearer(token: string) {
  return {
    authorization: `Bearer ${token}`,
  };
}
