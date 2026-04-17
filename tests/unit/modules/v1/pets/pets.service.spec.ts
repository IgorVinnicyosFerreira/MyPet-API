import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import type { IFilesRepository } from '@/modules/v1/files/repositories/files-interfaces.repository';
import { PetsService } from '@/modules/v1/pets/pets.service';
import type { IPetsRepository } from '@/modules/v1/pets/repositories/pets-interfaces.repository';

const defaultPetWithHealthSummary = {
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
  healthSummary: {
    lastWeight: {
      id: 'weight-1',
      weightGrams: 8500,
      measuredAt: new Date('2026-01-01T10:00:00Z'),
      note: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    lastVaccination: null,
    lastConsultation: null,
    lastDewormer: null,
    lastAntiparasitic: null,
    lastFeeding: null,
  },
};

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
    updatePetByIdOptimistic: async (input) => ({
      id: input.petId,
      name: input.data.name ?? 'Luna',
      species: input.data.species ?? 'Canine',
      breed: input.data.breed ?? null,
      birthDate: input.data.birthDate ?? null,
      sex: input.data.sex ?? null,
      notes: input.data.notes ?? null,
      primaryTutorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    resolveUserRoleForPet: async () => 'PRIMARY_TUTOR',
    getPetWithHealthSummary: async () => ({ ...defaultPetWithHealthSummary }),
    findCareRelation: async () => null,
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
  describe('updatePetById', () => {
    it('updates allowed fields and maps observations to notes', async () => {
      const calls: Array<{
        petId: string;
        expectedUpdatedAt: Date;
        data: Record<string, unknown>;
      }> = [];
      const expectedUpdatedAt = new Date('2026-04-07T12:30:00.000Z');

      const service = new PetsService(
        makePetsRepositoryMock({
          updatePetByIdOptimistic: async (input) => {
            calls.push({
              petId: input.petId,
              expectedUpdatedAt: input.expectedUpdatedAt,
              data: input.data,
            });

            return {
              id: input.petId,
              name: 'Luna Atualizada',
              species: 'Canine',
              breed: null,
              birthDate: null,
              sex: null,
              notes: 'Alergica a frango',
              primaryTutorId: 'user-1',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              updatedAt: new Date('2026-04-07T12:31:00.000Z'),
            };
          },
        }),
        makeFilesRepositoryMock(),
      );

      const result = await service.updatePetById('pet-1', 'user-1', {
        expectedUpdatedAt,
        name: 'Luna Atualizada',
        observations: 'Alergica a frango',
      });

      expect(result.name).toBe('Luna Atualizada');
      expect(result.notes).toBe('Alergica a frango');
      expect(calls).toEqual([
        {
          petId: 'pet-1',
          expectedUpdatedAt,
          data: {
            name: 'Luna Atualizada',
            notes: 'Alergica a frango',
          },
        },
      ]);
    });

    it('returns 409 for stale expectedUpdatedAt', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          updatePetByIdOptimistic: async () => null,
        }),
        makeFilesRepositoryMock(),
      );

      await expect(
        service.updatePetById('pet-1', 'user-1', {
          expectedUpdatedAt: new Date('2026-04-07T12:30:00.000Z'),
          name: 'Mila',
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });

    it('returns 403 when actor has no relation to the pet', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          findPetById: async () => ({
            id: 'pet-1',
            name: 'Luna',
            species: 'Canine',
            breed: null,
            birthDate: null,
            sex: null,
            notes: null,
            primaryTutorId: 'owner-user',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          findCareRelation: async () => null,
        }),
        makeFilesRepositoryMock(),
      );

      await expect(
        service.updatePetById('pet-1', 'user-2', {
          expectedUpdatedAt: new Date('2026-04-07T12:30:00.000Z'),
          name: 'Novo Nome',
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('returns 404 when pet does not exist', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          findPetById: async () => null,
        }),
        makeFilesRepositoryMock(),
      );

      await expect(
        service.updatePetById('pet-missing', 'user-1', {
          expectedUpdatedAt: new Date('2026-04-07T12:30:00.000Z'),
          species: 'Feline',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'RESOURCE_NOT_FOUND',
      });
    });
  });

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

  describe('getPetById', () => {
    it('grants access to the primary tutor and returns PetWithHealthSummary', async () => {
      const service = new PetsService(
        makePetsRepositoryMock(),
        makeFilesRepositoryMock(),
      );

      const result = await service.getPetById('pet-1', 'user-1');

      expect(result.id).toBe('pet-1');
      expect(result.healthSummary).toBeDefined();
      expect(result.healthSummary.lastWeight).not.toBeNull();
    });

    it('grants access to user with ACTIVE care relation', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          getPetWithHealthSummary: async () => ({
            ...defaultPetWithHealthSummary,
            primaryTutorId: 'other-user',
          }),
          findCareRelation: async () => ({ status: 'ACTIVE' }),
        }),
        makeFilesRepositoryMock(),
      );

      const result = await service.getPetById('pet-1', 'user-1');

      expect(result.id).toBe('pet-1');
    });

    it('denies access (403) for user with no relation', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          getPetWithHealthSummary: async () => ({
            ...defaultPetWithHealthSummary,
            primaryTutorId: 'other-user',
          }),
          findCareRelation: async () => null,
        }),
        makeFilesRepositoryMock(),
      );

      await expect(service.getPetById('pet-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('denies access (403) for care relation with status REVOKED', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          getPetWithHealthSummary: async () => ({
            ...defaultPetWithHealthSummary,
            primaryTutorId: 'other-user',
          }),
          findCareRelation: async () => ({ status: 'REVOKED' }),
        }),
        makeFilesRepositoryMock(),
      );

      await expect(service.getPetById('pet-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('denies access (403) for care relation with status PENDING', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          getPetWithHealthSummary: async () => ({
            ...defaultPetWithHealthSummary,
            primaryTutorId: 'other-user',
          }),
          findCareRelation: async () => ({ status: 'PENDING' }),
        }),
        makeFilesRepositoryMock(),
      );

      await expect(service.getPetById('pet-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('returns 404 when pet does not exist', async () => {
      const service = new PetsService(
        makePetsRepositoryMock({
          getPetWithHealthSummary: async () => null,
        }),
        makeFilesRepositoryMock(),
      );

      await expect(
        service.getPetById('pet-nonexistent', 'user-1'),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'RESOURCE_NOT_FOUND',
      });
    });

    it('returns null for health categories without records', async () => {
      const emptyHealthSummary = {
        ...defaultPetWithHealthSummary,
        healthSummary: {
          lastWeight: null,
          lastVaccination: null,
          lastConsultation: null,
          lastDewormer: null,
          lastAntiparasitic: null,
          lastFeeding: null,
        },
      };

      const service = new PetsService(
        makePetsRepositoryMock({
          getPetWithHealthSummary: async () => emptyHealthSummary,
        }),
        makeFilesRepositoryMock(),
      );

      const result = await service.getPetById('pet-1', 'user-1');

      expect(result.healthSummary.lastWeight).toBeNull();
      expect(result.healthSummary.lastVaccination).toBeNull();
      expect(result.healthSummary.lastConsultation).toBeNull();
      expect(result.healthSummary.lastDewormer).toBeNull();
      expect(result.healthSummary.lastAntiparasitic).toBeNull();
      expect(result.healthSummary.lastFeeding).toBeNull();
    });
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
