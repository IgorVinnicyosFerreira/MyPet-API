import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { createTestApp } from '../../../../support/app';
import { bearer, createAuthSession, injectJson } from '../../../../support/http-client';

const canonicalCreatePetPayloadFixture = {
  Canine: {
    name: 'Luna',
    species: 'Canine',
    breed: 'SRD',
  },
  Feline: {
    name: 'Mia',
    species: 'Feline',
    breed: 'Persa',
  },
} as const;

const invalidCreatePetPayloadFixture = [
  {
    scenario: 'species Bird',
    payload: {
      name: 'Piu',
      species: 'Bird',
    },
  },
  {
    scenario: 'species lowercase canine',
    payload: {
      name: 'Nina',
      species: 'canine',
    },
  },
  {
    scenario: 'species empty string',
    payload: {
      name: 'Bolt',
      species: '',
    },
  },
  {
    scenario: 'species null',
    payload: {
      name: 'Thor',
      species: null,
    },
  },
] as const;

type OpenApiSchema = {
  $ref?: string;
  properties?: Record<string, OpenApiSchema>;
  enum?: string[];
};

type OpenApiDocument = {
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
  paths?: Record<
    string,
    {
      post?: {
        requestBody?: {
          content?: Record<string, { schema?: OpenApiSchema }>;
        };
      };
    }
  >;
};

describe('Pets contracts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/pets species contract', () => {
    for (const [species, payload] of Object.entries(canonicalCreatePetPayloadFixture)) {
      it(`accepts canonical species ${species} and persists the pet`, async () => {
        const session = await createAuthSession(app);

        const response = await injectJson(app, {
          method: 'POST',
          url: '/v1/pets',
          headers: bearer(session.token),
          payload,
        });

        expect(response.statusCode).toBe(201);

        const body = response.json() as {
          id: string;
          name: string;
          species: string;
          primaryTutorId: string;
        };

        expect(body.id).toBeString();
        expect(body.name).toBe(payload.name);
        expect(body.species).toBe(species);
        expect(body.primaryTutorId).toBe(session.user.id);

        const persisted = await prisma.pets.findUnique({
          where: {
            id: body.id,
          },
        });

        expect(persisted).not.toBeNull();
        expect(persisted?.species).toBe(species);
      });
    }

    for (const { scenario, payload } of invalidCreatePetPayloadFixture) {
      it(`rejects invalid payload (${scenario}) and does not persist`, async () => {
        const session = await createAuthSession(app);
        const beforeCount = await prisma.pets.count({
          where: {
            primaryTutorId: session.user.id,
          },
        });

        const response = await injectJson(app, {
          method: 'POST',
          url: '/v1/pets',
          headers: bearer(session.token),
          payload,
        });

        expect(response.statusCode).toBe(400);

        const body = response.json() as {
          error: { code: string; traceId: string };
        };

        expect(body.error.code).toBe('BAD_REQUEST');
        expect(body.error.traceId).toBeString();

        const afterCount = await prisma.pets.count({
          where: {
            primaryTutorId: session.user.id,
          },
        });

        expect(afterCount).toBe(beforeCount);
      });
    }

    it('rejects mixed-invalid payload variations with BAD_REQUEST', async () => {
      const session = await createAuthSession(app);

      const mixedInvalidPayloads = [
        {
          name: '',
          species: 'Bird',
          breed:
            '123456789012345678901234567890123456789012345678901234567890123456789012345678901',
        },
        {
          name: 'Luna',
          species: null,
          notes: 'x'.repeat(2100),
        },
        {
          name: 'Mia',
          species: 'FELINE',
          birthDate: 'not-a-date',
        },
      ];

      for (const payload of mixedInvalidPayloads) {
        const response = await injectJson(app, {
          method: 'POST',
          url: '/v1/pets',
          headers: bearer(session.token),
          payload,
        });

        expect(response.statusCode).toBe(400);
        const body = response.json() as { error: { code: string } };
        expect(body.error.code).toBe('BAD_REQUEST');
      }
    });

    it('advertises allowed species enum in OpenAPI contract', async () => {
      const docsResponse = await injectJson(app, {
        method: 'GET',
        url: '/docs/openapi.json',
      });

      expect(docsResponse.statusCode).toBe(200);

      const openapi = docsResponse.json() as OpenApiDocument;
      const postPets = openapi.paths?.['/v1/pets/']?.post;
      const speciesEnum =
        postPets?.requestBody?.content?.['application/json']?.schema?.properties
          ?.species?.enum;

      expect(speciesEnum).toEqual(['Canine', 'Feline']);
    });
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

  describe('GET /v1/pets/:petId', () => {
    it('returns 200 with pet data and healthSummary for the primary tutor', async () => {
      const session = await createAuthSession(app);

      const petResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(session.token),
        payload: {
          name: 'Mel',
          species: 'Canine',
          breed: 'Golden',
        },
      });

      const pet = petResponse.json() as { id: string };

      await injectJson(app, {
        method: 'POST',
        url: `/v1/pets/${pet.id}/weights`,
        headers: bearer(session.token),
        payload: {
          weightGrams: 7800,
          measuredAt: '2026-03-10T10:00:00.000Z',
        },
      });

      await injectJson(app, {
        method: 'POST',
        url: `/v1/pets/${pet.id}/vaccinations`,
        headers: bearer(session.token),
        payload: {
          vaccineName: 'V10',
          appliedAt: '2026-03-11T09:00:00.000Z',
          vetName: 'Dra. Silva',
          reminderEnabled: false,
        },
      });

      const response = await injectJson(app, {
        method: 'GET',
        url: `/v1/pets/${pet.id}`,
        headers: bearer(session.token),
      });

      expect(response.statusCode).toBe(200);

      const body = response.json() as {
        id: string;
        name: string;
        healthSummary: {
          lastWeight: { weightGrams: number } | null;
          lastVaccination: { vaccineName: string } | null;
          lastConsultation: unknown;
          lastDewormer: unknown;
          lastAntiparasitic: unknown;
          lastFeeding: unknown;
        };
      };

      expect(body.id).toBe(pet.id);
      expect(body.name).toBe('Mel');
      expect(body.healthSummary).toBeDefined();
      expect(body.healthSummary.lastWeight).not.toBeNull();
      expect(body.healthSummary.lastWeight?.weightGrams).toBe(7800);
      expect(body.healthSummary.lastVaccination).not.toBeNull();
      expect(body.healthSummary.lastVaccination?.vaccineName).toBe('V10');
      expect(body.healthSummary.lastConsultation).toBeNull();
      expect(body.healthSummary.lastDewormer).toBeNull();
      expect(body.healthSummary.lastAntiparasitic).toBeNull();
      expect(body.healthSummary.lastFeeding).toBeNull();
    });

    it('returns 403 when user has no relation to the pet', async () => {
      const owner = await createAuthSession(app);
      const stranger = await createAuthSession(app);

      const petResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(owner.token),
        payload: {
          name: 'Rex',
          species: 'Canine',
        },
      });

      const pet = petResponse.json() as { id: string };

      const response = await injectJson(app, {
        method: 'GET',
        url: `/v1/pets/${pet.id}`,
        headers: bearer(stranger.token),
      });

      expect(response.statusCode).toBe(403);

      const body = response.json() as { error: { code: string } };
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 when petId does not exist', async () => {
      const session = await createAuthSession(app);

      const response = await injectJson(app, {
        method: 'GET',
        url: '/v1/pets/00000000-0000-0000-0000-000000000000',
        headers: bearer(session.token),
      });

      expect(response.statusCode).toBe(404);

      const body = response.json() as { error: { code: string } };
      expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('returns 400 when petId is not a valid UUID', async () => {
      const session = await createAuthSession(app);

      const response = await injectJson(app, {
        method: 'GET',
        url: '/v1/pets/not-a-uuid',
        headers: bearer(session.token),
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 200 with all healthSummary fields null for a pet with no records', async () => {
      const session = await createAuthSession(app);

      const petResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(session.token),
        payload: {
          name: 'Pipoca',
          species: 'Feline',
        },
      });

      const pet = petResponse.json() as { id: string };

      const response = await injectJson(app, {
        method: 'GET',
        url: `/v1/pets/${pet.id}`,
        headers: bearer(session.token),
      });

      expect(response.statusCode).toBe(200);

      const body = response.json() as {
        healthSummary: {
          lastWeight: unknown;
          lastVaccination: unknown;
          lastConsultation: unknown;
          lastDewormer: unknown;
          lastAntiparasitic: unknown;
          lastFeeding: unknown;
        };
      };

      expect(body.healthSummary.lastWeight).toBeNull();
      expect(body.healthSummary.lastVaccination).toBeNull();
      expect(body.healthSummary.lastConsultation).toBeNull();
      expect(body.healthSummary.lastDewormer).toBeNull();
      expect(body.healthSummary.lastAntiparasitic).toBeNull();
      expect(body.healthSummary.lastFeeding).toBeNull();
    });

    it('returns only the most recent record per category with partial records', async () => {
      const session = await createAuthSession(app);

      const petResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(session.token),
        payload: {
          name: 'Bolt',
          species: 'Canine',
        },
      });

      const pet = petResponse.json() as { id: string };

      await injectJson(app, {
        method: 'POST',
        url: `/v1/pets/${pet.id}/weights`,
        headers: bearer(session.token),
        payload: {
          weightGrams: 3000,
          measuredAt: '2026-01-01T10:00:00.000Z',
        },
      });

      await injectJson(app, {
        method: 'POST',
        url: `/v1/pets/${pet.id}/weights`,
        headers: bearer(session.token),
        payload: {
          weightGrams: 4500,
          measuredAt: '2026-03-01T10:00:00.000Z',
        },
      });

      const response = await injectJson(app, {
        method: 'GET',
        url: `/v1/pets/${pet.id}`,
        headers: bearer(session.token),
      });

      expect(response.statusCode).toBe(200);

      const body = response.json() as {
        healthSummary: {
          lastWeight: { weightGrams: number } | null;
          lastVaccination: unknown;
        };
      };

      expect(body.healthSummary.lastWeight).not.toBeNull();
      expect(body.healthSummary.lastWeight?.weightGrams).toBe(4500);
      expect(body.healthSummary.lastVaccination).toBeNull();
    });
  });

  describe('PATCH /v1/pets/:petId', () => {
    it('returns 200 and preserves omitted fields on partial update', async () => {
      const session = await createAuthSession(app);

      const createResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(session.token),
        payload: {
          name: 'Luna',
          species: 'Canine',
          breed: 'SRD',
          notes: 'Sem observacoes',
        },
      });

      const created = createResponse.json() as {
        id: string;
        species: string;
        breed: string | null;
        updatedAt: string;
      };

      const patchResponse = await injectJson(app, {
        method: 'PATCH',
        url: `/v1/pets/${created.id}`,
        headers: bearer(session.token),
        payload: {
          name: 'Luna Atualizada',
          observations: 'Alergica a frango',
          expectedUpdatedAt: created.updatedAt,
        },
      });

      expect(patchResponse.statusCode).toBe(200);

      const body = patchResponse.json() as {
        id: string;
        name: string;
        species: string;
        breed: string | null;
        notes: string | null;
        updatedAt: string;
      };

      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Luna Atualizada');
      expect(body.notes).toBe('Alergica a frango');
      expect(body.species).toBe(created.species);
      expect(body.breed).toBe(created.breed);
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(
        new Date(created.updatedAt).getTime(),
      );
    });

    it('returns 409 when expectedUpdatedAt is stale', async () => {
      const session = await createAuthSession(app);

      const createResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(session.token),
        payload: {
          name: 'Nina',
          species: 'Canine',
        },
      });

      const created = createResponse.json() as { id: string; updatedAt: string };

      await injectJson(app, {
        method: 'PATCH',
        url: `/v1/pets/${created.id}`,
        headers: bearer(session.token),
        payload: {
          species: 'Feline',
          expectedUpdatedAt: created.updatedAt,
        },
      });

      const staleResponse = await injectJson(app, {
        method: 'PATCH',
        url: `/v1/pets/${created.id}`,
        headers: bearer(session.token),
        payload: {
          name: 'Outro Nome',
          expectedUpdatedAt: created.updatedAt,
        },
      });

      expect(staleResponse.statusCode).toBe(409);

      const body = staleResponse.json() as {
        error: { code: string; traceId: string };
      };

      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.traceId).toBeString();
    });

    it('returns 400 and keeps persisted species unchanged for invalid species patch', async () => {
      const session = await createAuthSession(app);

      const createResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(session.token),
        payload: {
          name: 'Nina',
          species: 'Canine',
        },
      });

      const created = createResponse.json() as {
        id: string;
        updatedAt: string;
        species: string;
      };

      const invalidPatchResponse = await injectJson(app, {
        method: 'PATCH',
        url: `/v1/pets/${created.id}`,
        headers: bearer(session.token),
        payload: {
          species: 'Bird',
          expectedUpdatedAt: created.updatedAt,
        },
      });

      expect(invalidPatchResponse.statusCode).toBe(400);

      const invalidPatchBody = invalidPatchResponse.json() as {
        error: { code: string; traceId: string };
      };

      expect(invalidPatchBody.error.code).toBe('BAD_REQUEST');
      expect(invalidPatchBody.error.traceId).toBeString();

      const petResponse = await injectJson(app, {
        method: 'GET',
        url: `/v1/pets/${created.id}`,
        headers: bearer(session.token),
      });

      expect(petResponse.statusCode).toBe(200);

      const petBody = petResponse.json() as { species: string };
      expect(petBody.species).toBe('Canine');
    });

    it('returns 403 and does not mutate pet for unrelated user', async () => {
      const owner = await createAuthSession(app);
      const stranger = await createAuthSession(app);

      const createResponse = await injectJson(app, {
        method: 'POST',
        url: '/v1/pets',
        headers: bearer(owner.token),
        payload: {
          name: 'Rex',
          species: 'Canine',
        },
      });

      const created = createResponse.json() as {
        id: string;
        updatedAt: string;
      };

      const forbiddenResponse = await injectJson(app, {
        method: 'PATCH',
        url: `/v1/pets/${created.id}`,
        headers: bearer(stranger.token),
        payload: {
          name: 'Nome Invalido',
          expectedUpdatedAt: created.updatedAt,
        },
      });

      expect(forbiddenResponse.statusCode).toBe(403);

      const forbiddenBody = forbiddenResponse.json() as {
        error: { code: string; traceId: string };
      };

      expect(forbiddenBody.error.code).toBe('FORBIDDEN');
      expect(forbiddenBody.error.traceId).toBeString();

      const ownerView = await injectJson(app, {
        method: 'GET',
        url: `/v1/pets/${created.id}`,
        headers: bearer(owner.token),
      });

      expect(ownerView.statusCode).toBe(200);

      const ownerPet = ownerView.json() as { name: string };
      expect(ownerPet.name).toBe('Rex');
    });

    it('returns 404 envelope for nonexistent pet', async () => {
      const session = await createAuthSession(app);

      const response = await injectJson(app, {
        method: 'PATCH',
        url: '/v1/pets/00000000-0000-0000-0000-000000000000',
        headers: bearer(session.token),
        payload: {
          name: 'Nao Deve Atualizar',
          expectedUpdatedAt: '2026-04-07T12:30:00.000Z',
        },
      });

      expect(response.statusCode).toBe(404);

      const body = response.json() as {
        error: { code: string; traceId: string };
      };

      expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(body.error.traceId).toBeString();
    });
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
