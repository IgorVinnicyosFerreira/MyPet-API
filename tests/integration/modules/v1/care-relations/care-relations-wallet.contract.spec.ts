import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { createTestApp } from '../../../../support/app';
import { bearer, createAuthSession, injectJson } from '../../../../support/http-client';

describe('Care relations and digital wallet contracts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces care-relation role restrictions and wallet authorization', async () => {
    const primary = await createAuthSession(app);
    const invited = await createAuthSession(app);
    const outsider = await createAuthSession(app);

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(primary.token),
      payload: {
        name: 'Tobby',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const forbiddenInvite = await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/care-relations`,
      headers: bearer(invited.token),
      payload: {
        userId: outsider.user.id,
        role: 'CAREGIVER',
      },
    });

    expect(forbiddenInvite.statusCode).toBe(403);

    const createRelation = await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/care-relations`,
      headers: bearer(primary.token),
      payload: {
        userId: invited.user.id,
        role: 'CO_TUTOR',
      },
    });

    expect(createRelation.statusCode).toBe(201);

    await prisma.vaccinations.create({
      data: {
        petId: pet.id,
        vaccineName: 'V10',
        appliedAt: new Date('2026-03-01T10:00:00.000Z'),
        vetName: 'Dr. Silva',
        reminderEnabled: true,
        createdByUserId: primary.user.id,
      },
    });

    await prisma.sanitaryRecords.create({
      data: {
        petId: pet.id,
        category: 'DEWORMER',
        productName: 'Vermifugo X',
        appliedAt: new Date('2026-03-02T10:00:00.000Z'),
        reminderEnabled: true,
        createdByUserId: primary.user.id,
      },
    });

    const walletAllowed = await injectJson(app, {
      method: 'GET',
      url: `/v1/pets/${pet.id}/digital-wallet?from=2026-03-01&to=2026-03-31`,
      headers: bearer(invited.token),
    });

    expect(walletAllowed.statusCode).toBe(200);
    const wallet = walletAllowed.json() as {
      pet: { id: string };
      vaccinations: unknown[];
      sanitaryRecords: unknown[];
    };

    expect(wallet.pet.id).toBe(pet.id);
    expect(wallet.vaccinations.length).toBeGreaterThan(0);
    expect(wallet.sanitaryRecords.length).toBeGreaterThan(0);

    const walletForbidden = await injectJson(app, {
      method: 'GET',
      url: `/v1/pets/${pet.id}/digital-wallet`,
      headers: bearer(outsider.token),
    });

    expect(walletForbidden.statusCode).toBe(403);
  });
});
