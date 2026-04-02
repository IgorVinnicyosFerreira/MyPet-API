import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../../support/app';
import { bearer, injectJson } from '../../../../support/http-client';

describe('Auth contracts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns user fields plus token and grants immediate protected access on register', async () => {
    const email = `register-${randomUUID()}@example.com`;

    const registerResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        name: 'Register User',
        email,
        password: 'password123',
      },
    });

    expect(registerResponse.statusCode).toBe(201);

    const registerBody = registerResponse.json() as {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
      token: string;
      expiresIn: number;
    };

    expect(registerBody.id).toBeString();
    expect(registerBody.name).toBe('Register User');
    expect(registerBody.email).toBe(email);
    expect(registerBody.createdAt).toBeString();
    expect(registerBody.updatedAt).toBeString();
    expect(registerBody.token).toBeString();
    expect(registerBody.expiresIn).toBe(3600);

    const protectedResponse = await injectJson(app, {
      method: 'GET',
      url: `/v1/users/${registerBody.id}`,
      headers: bearer(registerBody.token),
    });

    expect(protectedResponse.statusCode).toBe(200);

    const protectedBody = protectedResponse.json() as {
      id: string;
      email: string;
      passwordHash?: string;
    };

    expect(protectedBody.id).toBe(registerBody.id);
    expect(protectedBody.email).toBe(email);
    expect(protectedBody.passwordHash).toBeUndefined();
  });

  it('returns stable conflict envelope and no token when register email already exists', async () => {
    const email = `duplicate-${randomUUID()}@example.com`;

    const firstRegister = await injectJson(app, {
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        name: 'First User',
        email,
        password: 'password123',
      },
    });

    expect(firstRegister.statusCode).toBe(201);

    const secondRegister = await injectJson(app, {
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        name: 'Second User',
        email,
        password: 'password123',
      },
    });

    expect(secondRegister.statusCode).toBe(409);

    const body = secondRegister.json() as {
      error: {
        code: string;
        message: string;
        traceId: string;
      };
      token?: string;
      expiresIn?: number;
    };

    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toBeString();
    expect(body.error.traceId).toBeString();
    expect(body.token).toBeUndefined();
    expect(body.expiresIn).toBeUndefined();
  });
});
