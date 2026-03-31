import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import type { IFilesRepository } from '@/modules/v1/files/repositories/files-interfaces.repository';
import { PetsService } from '@/modules/v1/pets/pets.service';
import type { IPetsRepository } from '@/modules/v1/pets/repositories/pets-interfaces.repository';

function makePetsRepositoryMock(overrides?: Partial<IPetsRepository>): IPetsRepository {
  return {
    createPet: async () => ({}) as never,
    listByResponsibleUser: async () => [],
    findPetById: async () => ({
      id: 'pet-1',
      name: 'Luna',
      species: 'Canine',
      breed: null,
      birthDate: null,
      sex: null,
      notes: null,
      primaryTutorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    resolveUserRoleForPet: async () => 'PRIMARY_TUTOR',
    findActiveFeeding: async () => null,
    closeFeeding: async () => undefined,
    createFeeding: async () => ({ id: 'feeding-1' }),
    createWeight: async () => ({ id: 'weight-1' }),
    createConsultation: async () => ({ id: 'consultation-1' }),
    createExam: async () => ({ id: 'exam-1' }),
    createExamAttachments: async () => undefined,
    createVaccination: async () => ({ id: 'vaccination-1' }),
    createSanitaryRecord: async () => ({ id: 'sanitary-1' }),
    listHistory: async () => [],
    updateClinicalRecord: async () => ({
      eventAt: new Date(),
      version: 2,
      payload: {},
    }),
    ...overrides,
  };
}

function makeFilesRepositoryMock(
  overrides?: Partial<IFilesRepository>,
): IFilesRepository {
  return {
    createStoredFile: async () => ({}) as never,
    findByIds: async () => [],
    ...overrides,
  };
}

describe('PetsService', () => {
  it('blocks caregivers from creating clinical records', async () => {
    const service = new PetsService(
      makePetsRepositoryMock({
        resolveUserRoleForPet: async () => 'CAREGIVER',
      }),
      makeFilesRepositoryMock(),
    );

    await expect(
      service.createFeeding('pet-1', 'user-2', {
        type: 'FEED',
        description: 'Racao premium',
        startsAt: new Date('2026-03-13T10:00:00.000Z'),
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('closes previous active feeding before creating a new one', async () => {
    const closeCalls: Array<{ recordId: string; endsAt: Date }> = [];

    const service = new PetsService(
      makePetsRepositoryMock({
        findActiveFeeding: async () => ({ id: 'feeding-active' }),
        closeFeeding: async (recordId, endsAt) => {
          closeCalls.push({ recordId, endsAt });
        },
      }),
      makeFilesRepositoryMock(),
    );

    const startsAt = new Date('2026-03-13T12:00:00.000Z');

    await service.createFeeding('pet-1', 'user-1', {
      type: 'MIXED',
      description: 'Transicao de dieta',
      startsAt,
    });

    expect(closeCalls).toEqual([
      {
        recordId: 'feeding-active',
        endsAt: startsAt,
      },
    ]);
  });

  it('returns 409 when optimistic lock update fails', async () => {
    const service = new PetsService(
      makePetsRepositoryMock({
        updateClinicalRecord: async () => null,
      }),
      makeFilesRepositoryMock(),
    );

    await expect(
      service.updateClinicalRecord('pet-1', 'user-1', 'WEIGHT', 'record-1', {
        version: 2,
        payload: {
          weightGrams: 4500,
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });
});
