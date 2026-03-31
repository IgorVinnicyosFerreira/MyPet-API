import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../../support/app';
import { createMedication, createPrescription } from '../../../../support/factories';
import { bearer, createAuthSession, injectJson } from '../../../../support/http-client';

describe('Medication agenda contract', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns agenda ordered by nextDoseAt and filtered by day', async () => {
    const session = await createAuthSession(app);

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Pingo',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const medA = await createMedication({ catalogScope: 'GLOBAL' });
    const medB = await createMedication({ catalogScope: 'GLOBAL' });
    const medC = await createMedication({ catalogScope: 'GLOBAL' });

    await createPrescription({
      petId: pet.id,
      medicationId: medB.id,
      createdByUserId: session.user.id,
      nextDoseAt: new Date('2026-03-15T12:00:00.000Z'),
    });

    await createPrescription({
      petId: pet.id,
      medicationId: medA.id,
      createdByUserId: session.user.id,
      nextDoseAt: new Date('2026-03-15T09:00:00.000Z'),
    });

    await createPrescription({
      petId: pet.id,
      medicationId: medC.id,
      createdByUserId: session.user.id,
      nextDoseAt: new Date('2026-03-16T09:00:00.000Z'),
    });

    const response = await injectJson(app, {
      method: 'GET',
      url: `/v1/pets/${pet.id}/medication-agenda?date=2026-03-15`,
      headers: bearer(session.token),
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      items: Array<{
        nextDoseAt: string;
      }>;
    };

    expect(body.items).toHaveLength(2);
    expect(new Date(body.items[0].nextDoseAt).getTime()).toBeLessThanOrEqual(
      new Date(body.items[1].nextDoseAt).getTime(),
    );
  });
});
