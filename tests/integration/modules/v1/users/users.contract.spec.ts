import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../../support/app';
import {
  bearer,
  createAuthSession,
  createRoleSession,
  injectJson,
} from '../../../../support/http-client';

describe('Users contracts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows only SUPER_ADMIN to list users through GET /v1/users', async () => {
    const admin = await createRoleSession({
      role: 'SUPER_ADMIN',
      email: `admin-list-${randomUUID()}@example.com`,
    });

    await createRoleSession({
      role: 'USER',
      email: `target-list-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'GET',
      url: '/v1/users',
      headers: bearer(admin.token),
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as Array<{
      id: string;
      email: string;
      passwordHash?: string;
    }>;

    expect(Array.isArray(body)).toBeTrue();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]?.id).toBeString();
    expect(body[0]?.email).toBeString();
    expect(body[0]?.passwordHash).toBeUndefined();
  });

  it('returns 403 for GET /v1/users when actor is not SUPER_ADMIN', async () => {
    const actor = await createRoleSession({
      role: 'USER',
      email: `actor-list-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'GET',
      url: '/v1/users',
      headers: bearer(actor.token),
    });

    expect(response.statusCode).toBe(403);

    const body = response.json() as { error: { code: string; traceId: string } };
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.traceId).toBeString();
  });

  it('updates own profile through PATCH /v1/users/{userId}', async () => {
    const session = await createAuthSession(app, {
      email: `self-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'PATCH',
      url: `/v1/users/${session.user.id}`,
      headers: bearer(session.token),
      payload: {
        name: 'Self Updated',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      id: string;
      name: string;
      email: string;
      passwordHash?: string;
    };

    expect(body.id).toBe(session.user.id);
    expect(body.name).toBe('Self Updated');
    expect(body.passwordHash).toBeUndefined();
  });

  it('allows SUPER_ADMIN to update another user profile', async () => {
    const admin = await createRoleSession({
      role: 'SUPER_ADMIN',
      email: `admin-${randomUUID()}@example.com`,
    });

    const target = await createRoleSession({
      role: 'USER',
      email: `target-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'PATCH',
      url: `/v1/users/${target.user.id}`,
      headers: bearer(admin.token),
      payload: {
        name: 'Updated by Admin',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as { id: string; name: string };
    expect(body.id).toBe(target.user.id);
    expect(body.name).toBe('Updated by Admin');
  });

  it('returns 403 when unrelated user tries to update another user', async () => {
    const actor = await createRoleSession({
      role: 'USER',
      email: `actor-${randomUUID()}@example.com`,
    });

    const target = await createRoleSession({
      role: 'USER',
      email: `target-forbidden-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'PATCH',
      url: `/v1/users/${target.user.id}`,
      headers: bearer(actor.token),
      payload: {
        name: 'Should Fail',
      },
    });

    expect(response.statusCode).toBe(403);

    const body = response.json() as { error: { code: string; traceId: string } };
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.traceId).toBeString();
  });

  it('returns 409 when patching email to one that already exists', async () => {
    const actor = await createRoleSession({
      role: 'USER',
      email: `actor-conflict-${randomUUID()}@example.com`,
    });

    const existing = await createRoleSession({
      role: 'USER',
      email: `existing-conflict-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'PATCH',
      url: `/v1/users/${actor.user.id}`,
      headers: bearer(actor.token),
      payload: {
        email: existing.email,
      },
    });

    expect(response.statusCode).toBe(409);

    const body = response.json() as { error: { code: string; traceId: string } };
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.traceId).toBeString();
  });

  it('returns user for authenticated GET /v1/users/{userId}', async () => {
    const session = await createAuthSession(app, {
      email: `get-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'GET',
      url: `/v1/users/${session.user.id}`,
      headers: bearer(session.token),
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      id: string;
      email: string;
      passwordHash?: string;
    };

    expect(body.id).toBe(session.user.id);
    expect(body.email).toBe(session.email);
    expect(body.passwordHash).toBeUndefined();
  });

  it('returns 401 for GET /v1/users/{userId} without bearer token', async () => {
    const session = await createRoleSession({
      role: 'USER',
      email: `unauth-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'GET',
      url: `/v1/users/${session.user.id}`,
    });

    expect(response.statusCode).toBe(401);

    const body = response.json() as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when bearer token belongs to a deleted user', async () => {
    const admin = await createRoleSession({
      role: 'SUPER_ADMIN',
      email: `admin-token-orphan-${randomUUID()}@example.com`,
    });

    const actor = await createRoleSession({
      role: 'USER',
      email: `actor-token-orphan-${randomUUID()}@example.com`,
    });

    const deleteResponse = await injectJson(app, {
      method: 'DELETE',
      url: `/v1/users/${actor.user.id}`,
      headers: bearer(admin.token),
    });

    expect(deleteResponse.statusCode).toBe(204);

    const response = await injectJson(app, {
      method: 'GET',
      url: `/v1/users/${admin.user.id}`,
      headers: bearer(actor.token),
    });

    expect(response.statusCode).toBe(401);

    const body = response.json() as { error: { code: string; traceId: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.traceId).toBeString();
  });

  it('returns 404 for GET /v1/users/{userId} when user does not exist', async () => {
    const session = await createRoleSession({
      role: 'USER',
      email: `missing-get-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'GET',
      url: `/v1/users/${randomUUID()}`,
      headers: bearer(session.token),
    });

    expect(response.statusCode).toBe(404);

    const body = response.json() as { error: { code: string } };
    expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('deletes user with SUPER_ADMIN and returns 204', async () => {
    const admin = await createRoleSession({
      role: 'SUPER_ADMIN',
      email: `admin-delete-${randomUUID()}@example.com`,
    });

    const target = await createRoleSession({
      role: 'USER',
      email: `target-delete-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'DELETE',
      url: `/v1/users/${target.user.id}`,
      headers: bearer(admin.token),
    });

    expect(response.statusCode).toBe(204);
  });

  it('returns 403 when non-admin tries to delete user', async () => {
    const actor = await createRoleSession({
      role: 'USER',
      email: `actor-delete-${randomUUID()}@example.com`,
    });

    const target = await createRoleSession({
      role: 'USER',
      email: `target-delete-forbidden-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'DELETE',
      url: `/v1/users/${target.user.id}`,
      headers: bearer(actor.token),
    });

    expect(response.statusCode).toBe(403);

    const body = response.json() as { error: { code: string } };
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when SUPER_ADMIN tries to delete missing user', async () => {
    const admin = await createRoleSession({
      role: 'SUPER_ADMIN',
      email: `admin-delete-missing-${randomUUID()}@example.com`,
    });

    const response = await injectJson(app, {
      method: 'DELETE',
      url: `/v1/users/${randomUUID()}`,
      headers: bearer(admin.token),
    });

    expect(response.statusCode).toBe(404);

    const body = response.json() as { error: { code: string; traceId: string } };
    expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(body.error.traceId).toBeString();
  });
});
