import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../../support/app';
import { createMedication } from '../../../../support/factories';
import { bearer, createAuthSession, injectJson } from '../../../../support/http-client';

describe('Prescriptions contracts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates prescription and returns 409 for stale update version', async () => {
    const session = await createAuthSession(app);
    const medication = await createMedication({ catalogScope: 'GLOBAL' });

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Maya',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const createResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/prescriptions',
      headers: bearer(session.token),
      payload: {
        petId: pet.id,
        medicationId: medication.id,
        dosageValue: 1,
        dosageUnit: 'UNIT',
        frequencyValue: 8,
        frequencyUnit: 'HOURS',
        startsAt: '2026-03-13T08:00:00.000Z',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const prescription = createResponse.json() as { id: string; version: number };

    const staleUpdate = await injectJson(app, {
      method: 'PATCH',
      url: `/v1/prescriptions/${prescription.id}`,
      headers: bearer(session.token),
      payload: {
        version: 999,
        status: 'PAUSED',
      },
    });

    expect(staleUpdate.statusCode).toBe(409);
    const staleBody = staleUpdate.json() as { error: { code: string } };
    expect(staleBody.error.code).toBe('CONFLICT');
  });

  it('creates dose record and rejects stale prescriptionVersion', async () => {
    const session = await createAuthSession(app);
    const medication = await createMedication({ catalogScope: 'GLOBAL' });

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Rex',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const createResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/prescriptions',
      headers: bearer(session.token),
      payload: {
        petId: pet.id,
        medicationId: medication.id,
        dosageValue: 1,
        dosageUnit: 'UNIT',
        frequencyValue: 12,
        frequencyUnit: 'HOURS',
        startsAt: '2026-03-13T08:00:00.000Z',
      },
    });

    const prescription = createResponse.json() as { id: string; version: number };

    const staleDoseResponse = await injectJson(app, {
      method: 'POST',
      url: `/v1/prescriptions/${prescription.id}/dose-records`,
      headers: bearer(session.token),
      payload: {
        takenAt: '2026-03-13T10:00:00.000Z',
        prescriptionVersion: 999,
      },
    });

    expect(staleDoseResponse.statusCode).toBe(409);

    const validDoseResponse = await injectJson(app, {
      method: 'POST',
      url: `/v1/prescriptions/${prescription.id}/dose-records`,
      headers: bearer(session.token),
      payload: {
        takenAt: '2026-03-13T11:00:00.000Z',
        prescriptionVersion: prescription.version,
      },
    });

    expect(validDoseResponse.statusCode).toBe(201);

    const doseBody = validDoseResponse.json() as {
      status: string;
      nextDoseRecalculated: boolean;
    };

    expect(doseBody.status).toBe('TAKEN');
    expect(doseBody.nextDoseRecalculated).toBeBoolean();
  });
});
