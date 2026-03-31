import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import { ensureRolePermission } from '@/lib/http/permissions';
import { CareRelationsService } from '@/modules/v1/care-relations/care-relations.service';
import type { ICareRelationsRepository } from '@/modules/v1/care-relations/repositories/care-relations-interfaces.repository';

function makeRepositoryMock(
  overrides?: Partial<ICareRelationsRepository>,
): ICareRelationsRepository {
  return {
    findPetById: async () => ({ id: 'pet-1', primaryTutorId: 'user-1' }),
    findRelation: async () => null,
    createRelation: async () => ({ id: 'rel-1', status: 'ACTIVE' }),
    reactivateRelation: async () => ({ id: 'rel-1', status: 'ACTIVE' }),
    ...overrides,
  };
}

describe('CareRelationsService', () => {
  it('allows only primary tutor to manage relations', async () => {
    const service = new CareRelationsService(makeRepositoryMock());

    await expect(
      service.create('pet-1', 'user-2', {
        userId: 'user-3',
        role: 'CO_TUTOR',
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('reactivates existing relation instead of creating duplicate', async () => {
    let reactivated = false;

    const service = new CareRelationsService(
      makeRepositoryMock({
        findRelation: async () => ({
          id: 'rel-1',
          status: 'REVOKED',
        }),
        reactivateRelation: async () => {
          reactivated = true;
          return { id: 'rel-1', status: 'ACTIVE' };
        },
      }),
    );

    await service.create('pet-1', 'user-1', {
      userId: 'user-3',
      role: 'CAREGIVER',
    });

    expect(reactivated).toBeTrue();
  });

  it('rejects self invitation from primary tutor', async () => {
    const service = new CareRelationsService(makeRepositoryMock());

    await expect(
      service.create('pet-1', 'user-1', {
        userId: 'user-1',
        role: 'CO_TUTOR',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });
});

describe('Role permission matrix', () => {
  it('allows CO_TUTOR to manage clinical records', () => {
    expect(() =>
      ensureRolePermission('CO_TUTOR', 'canManageClinicalRecords'),
    ).not.toThrow();
  });

  it('blocks CAREGIVER from clinical record management but allows dose records', () => {
    expect(() =>
      ensureRolePermission('CAREGIVER', 'canManageDoseRecords'),
    ).not.toThrow();
    expect(() =>
      ensureRolePermission('CAREGIVER', 'canManageClinicalRecords'),
    ).toThrow();
  });
});
