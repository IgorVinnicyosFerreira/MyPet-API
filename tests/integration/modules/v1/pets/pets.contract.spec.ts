import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../../support/app';
import { bearer, createAuthSession, injectJson } from '../../../../support/http-client';

describe('Pets contracts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates pet through /v1/pets and returns typed payload', async () => {
    const session = await createAuthSession(app);

    const response = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Luna',
        species: 'Canine',
        breed: 'SRD',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json() as {
      id: string;
      name: string;
      primaryTutorId: string;
    };

    expect(body.id).toBeString();
    expect(body.name).toBe('Luna');
    expect(body.primaryTutorId).toBe(session.user.id);
  });

  it('returns consolidated history sorted by event date', async () => {
    const session = await createAuthSession(app);

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Nina',
        species: 'Canine',
      },
    });

    const pet = petResponse.json() as { id: string };

    await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/feedings`,
      headers: bearer(session.token),
      payload: {
        type: 'FEED',
        description: 'Racao inicial',
        startsAt: '2026-03-13T08:00:00.000Z',
      },
    });

    await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/weights`,
      headers: bearer(session.token),
      payload: {
        weightGrams: 5400,
        measuredAt: '2026-03-14T09:00:00.000Z',
      },
    });

    const historyResponse = await injectJson(app, {
      method: 'GET',
      url: `/v1/pets/${pet.id}/history`,
      headers: bearer(session.token),
    });

    expect(historyResponse.statusCode).toBe(200);

    const history = historyResponse.json() as Array<{
      recordType: string;
      eventAt: string;
    }>;

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(new Date(history[0].eventAt).getTime()).toBeGreaterThanOrEqual(
      new Date(history[1].eventAt).getTime(),
    );
  });

  it('returns 409 envelope for stale version on clinical update', async () => {
    const session = await createAuthSession(app);

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Thor',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const weightResponse = await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/weights`,
      headers: bearer(session.token),
      payload: {
        weightGrams: 6200,
        measuredAt: '2026-03-13T11:00:00.000Z',
      },
    });

    const weight = weightResponse.json() as { id: string };

    const response = await injectJson(app, {
      method: 'PATCH',
      url: `/v1/pets/${pet.id}/history/WEIGHT/${weight.id}`,
      headers: bearer(session.token),
      payload: {
        version: 999,
        payload: {
          weightGrams: 6300,
        },
      },
    });

    expect(response.statusCode).toBe(409);

    const body = response.json() as {
      error: {
        code: string;
        traceId: string;
      };
    };

    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.traceId).toBeString();
  });
});
