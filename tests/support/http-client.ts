import { randomUUID } from 'node:crypto';
import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';
import { signJwt } from '@/lib/auth/jwt';
import type { UserFixtureRole } from './factories/user-factory';
import { createUser, createUserFixture } from './factories/user-factory';

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
  const headers = {
    ...(options.headers || {}),
  } as Record<string, string>;

  if (typeof options.payload !== 'undefined' && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }

  return app.inject({
    ...options,
    remoteAddress: nextRemoteAddress(),
    headers,
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

  const registerBody = registerResponse.json() as {
    id: string;
    email: string;
    name: string;
    token?: string;
    expiresIn?: number;
  };

  if (registerBody.token) {
    return {
      token: registerBody.token,
      user: {
        id: registerBody.id,
        email: registerBody.email,
        name: registerBody.name,
      },
      email,
      password,
    };
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

export async function createRoleSession(overrides?: {
  role?: UserFixtureRole;
  name?: string;
  email?: string;
  password?: string;
}) {
  const role = overrides?.role || 'USER';

  const user =
    overrides?.name || overrides?.email
      ? await createUser({
          name: overrides.name,
          email: overrides.email,
          password: overrides.password,
          isSuperAdmin: role === 'SUPER_ADMIN',
        })
      : await createUserFixture(role, {
          password: overrides?.password,
        });

  const token = signJwt({
    sub: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    role,
    email: user.email,
    password: user.password,
  };
}

export function bearer(token: string) {
  return {
    authorization: `Bearer ${token}`,
  };
}
