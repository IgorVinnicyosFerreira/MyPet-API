import '../../../../setup/integration.setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../../support/app';
import { bearer, createAuthSession, injectJson } from '../../../../support/http-client';

function sampleBase64Pdf() {
  return Buffer.from('%PDF-1.4 test').toString('base64');
}

describe('Attachments contracts', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('uploads EXAM file and binds it on exam creation', async () => {
    const session = await createAuthSession(app);

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Belinha',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const uploadResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/files/uploads',
      headers: bearer(session.token),
      payload: {
        petId: pet.id,
        domain: 'EXAM',
        originalName: 'hemograma.pdf',
        mimeType: 'application/pdf',
        contentBase64: sampleBase64Pdf(),
      },
    });

    expect(uploadResponse.statusCode).toBe(201);
    const uploaded = uploadResponse.json() as { id: string; domain: string };
    expect(uploaded.domain).toBe('EXAM');

    const examResponse = await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/exams`,
      headers: bearer(session.token),
      payload: {
        type: 'Hemograma',
        occurredAt: '2026-03-13T10:00:00.000Z',
        fileIds: [uploaded.id],
      },
    });

    expect(examResponse.statusCode).toBe(201);
  });

  it('uploads a base64 file with exactly 10MB of decoded content', async () => {
    const session = await createAuthSession(app);

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Luna',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const tenMbBase64 = Buffer.alloc(10 * 1024 * 1024, 1).toString('base64');

    const uploadResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/files/uploads',
      headers: bearer(session.token),
      payload: {
        petId: pet.id,
        domain: 'EXAM',
        originalName: 'large-exam.pdf',
        mimeType: 'application/pdf',
        contentBase64: tenMbBase64,
      },
    });

    expect(uploadResponse.statusCode).toBe(201);
  });

  it('rejects upload when decoded file content exceeds 10MB', async () => {
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

    const overTenMbBase64 = Buffer.alloc(10 * 1024 * 1024 + 1, 1).toString('base64');

    const uploadResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/files/uploads',
      headers: bearer(session.token),
      payload: {
        petId: pet.id,
        domain: 'EXAM',
        originalName: 'too-large-exam.pdf',
        mimeType: 'application/pdf',
        contentBase64: overTenMbBase64,
      },
    });

    expect(uploadResponse.statusCode).toBe(422);
    const body = uploadResponse.json() as { error: { code: string } };
    expect(body.error.code).toBe('UNPROCESSABLE_ENTITY');
  });

  it('creates vaccination with VACCINATION attachment and rejects domain mismatch', async () => {
    const session = await createAuthSession(app);

    const petResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/pets',
      headers: bearer(session.token),
      payload: {
        name: 'Apolo',
        species: 'Canine',
      },
    });
    const pet = petResponse.json() as { id: string };

    const vaccinationFileResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/files/uploads',
      headers: bearer(session.token),
      payload: {
        petId: pet.id,
        domain: 'VACCINATION',
        originalName: 'carteira.png',
        mimeType: 'image/png',
        contentBase64: Buffer.from('png').toString('base64'),
      },
    });

    const vaccinationFile = vaccinationFileResponse.json() as { id: string };

    const vaccinationResponse = await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/vaccinations`,
      headers: bearer(session.token),
      payload: {
        vaccineName: 'V10',
        appliedAt: '2026-03-13T09:00:00.000Z',
        vetName: 'Dr. Silva',
        reminderEnabled: true,
        nextDoseAt: '2026-09-13T09:00:00.000Z',
        fileId: vaccinationFile.id,
      },
    });

    expect(vaccinationResponse.statusCode).toBe(201);

    const examOnlyFileResponse = await injectJson(app, {
      method: 'POST',
      url: '/v1/files/uploads',
      headers: bearer(session.token),
      payload: {
        petId: pet.id,
        domain: 'EXAM',
        originalName: 'exam.pdf',
        mimeType: 'application/pdf',
        contentBase64: sampleBase64Pdf(),
      },
    });

    const examOnlyFile = examOnlyFileResponse.json() as { id: string };

    const invalidVaccinationResponse = await injectJson(app, {
      method: 'POST',
      url: `/v1/pets/${pet.id}/vaccinations`,
      headers: bearer(session.token),
      payload: {
        vaccineName: 'Raiva',
        appliedAt: '2026-03-13T09:00:00.000Z',
        vetName: 'Dr. Silva',
        reminderEnabled: false,
        fileId: examOnlyFile.id,
      },
    });

    expect(invalidVaccinationResponse.statusCode).toBe(422);
  });
});
