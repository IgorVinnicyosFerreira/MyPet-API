import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import { DigitalWalletsService } from '@/modules/v1/digital-wallets/digital-wallets.service';
import type { IDigitalWalletsRepository } from '@/modules/v1/digital-wallets/repositories/digital-wallets-interfaces.repository';

function makeRepositoryMock(
  overrides?: Partial<IDigitalWalletsRepository>,
): IDigitalWalletsRepository {
  return {
    resolveUserAccess: async () => true,
    findPetById: async () => ({
      id: 'pet-1',
      name: 'Luna',
      species: 'Canine',
      breed: 'SRD',
      birthDate: new Date('2022-01-01T00:00:00.000Z'),
      primaryTutorId: 'user-1',
    }),
    listVaccinations: async () => [
      { id: 'vac-2', appliedAt: new Date('2026-03-10T10:00:00.000Z') },
      { id: 'vac-1', appliedAt: new Date('2026-03-01T10:00:00.000Z') },
    ],
    listSanitaryRecords: async () => [
      { id: 'san-2', appliedAt: new Date('2026-03-09T10:00:00.000Z') },
      { id: 'san-1', appliedAt: new Date('2026-03-02T10:00:00.000Z') },
    ],
    ...overrides,
  };
}

describe('DigitalWalletsService', () => {
  it('builds JSON wallet response and forwards period filters', async () => {
    let receivedFrom: Date | undefined;
    let receivedTo: Date | undefined;

    const service = new DigitalWalletsService(
      makeRepositoryMock({
        listVaccinations: async (_petId, from, to) => {
          receivedFrom = from;
          receivedTo = to;
          return [];
        },
      }),
    );

    const result = await service.generate('user-1', 'pet-1', {
      from: '2026-03-01',
      to: '2026-03-31',
    });

    expect(receivedFrom?.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(receivedTo?.toISOString()).toBe('2026-03-31T23:59:59.999Z');
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result).toHaveProperty('pet');
    expect(result).toHaveProperty('vaccinations');
    expect(result).toHaveProperty('sanitaryRecords');
  });

  it('rejects access when user has no relation with pet', async () => {
    const service = new DigitalWalletsService(
      makeRepositoryMock({
        resolveUserAccess: async () => false,
      }),
    );

    await expect(service.generate('user-2', 'pet-1', {})).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });
});
