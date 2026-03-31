import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import { PrescriptionsService } from '@/modules/v1/prescriptions/prescriptions.service';
import type { IPrescriptionsRepository } from '@/modules/v1/prescriptions/repositories/prescriptions-interfaces.repository';

function makeRepositoryMock(
  overrides?: Partial<IPrescriptionsRepository>,
): IPrescriptionsRepository {
  return {
    resolveUserRoleForPet: async () => 'PRIMARY_TUTOR',
    findMedicationById: async () => ({
      id: 'med-1',
      name: 'Amoxicilina',
      catalogScope: 'GLOBAL',
      ownerUserId: null,
    }),
    findOrCreateTutorMedication: async () => ({
      id: 'med-2',
      name: 'Custom Med',
    }),
    createPrescription: async (input) => ({ id: 'pres-1', ...input }),
    findPrescriptionById: async () => ({
      id: 'pres-1',
      petId: 'pet-1',
      medicationId: 'med-1',
      dosageValue: 1,
      dosageUnit: 'UNIT',
      dosageOtherDescription: null,
      frequencyValue: 8,
      frequencyUnit: 'HOURS',
      startsAt: new Date('2026-03-13T08:00:00.000Z'),
      nextDoseAt: new Date('2026-03-13T16:00:00.000Z'),
      reminderEnabled: true,
      status: 'ACTIVE',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    updatePrescription: async (input) => ({ id: 'pres-1', ...input.payload }),
    findLatestTakenDose: async () => null,
    createDoseRecord: async (input) => ({ id: 'dose-1', ...input }),
    updatePrescriptionNextDose: async (_prescriptionId, _nextDoseAt) => undefined,
    listMedicationAgenda: async () => [],
    ...overrides,
  };
}

describe('PrescriptionsService - create/update rules', () => {
  it('rejects create when medicationId and medicationName are absent', async () => {
    const service = new PrescriptionsService(makeRepositoryMock());

    await expect(
      service.create('user-1', {
        petId: 'pet-1',
        dosageValue: 1,
        dosageUnit: 'UNIT',
        frequencyValue: 12,
        frequencyUnit: 'HOURS',
        startsAt: new Date('2026-03-13T08:00:00.000Z'),
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('requires dosageOtherDescription when dosageUnit=OTHER', async () => {
    const service = new PrescriptionsService(makeRepositoryMock());

    await expect(
      service.create('user-1', {
        petId: 'pet-1',
        medicationName: 'Formula manipulada',
        dosageValue: 3,
        dosageUnit: 'OTHER',
        frequencyValue: 24,
        frequencyUnit: 'HOURS',
        startsAt: new Date('2026-03-13T08:00:00.000Z'),
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('recalculates nextDoseAt when update changes schedule', async () => {
    let updatedPayload: { nextDoseAt?: Date } | null = null;

    const service = new PrescriptionsService(
      makeRepositoryMock({
        updatePrescription: async (input) => {
          updatedPayload = input.payload as { nextDoseAt?: Date };
          return { id: input.prescriptionId, ...input.payload };
        },
      }),
    );

    await service.update('user-1', 'pres-1', {
      version: 1,
      startsAt: new Date('2026-03-14T08:00:00.000Z'),
      frequencyValue: 2,
      frequencyUnit: 'DAYS',
    });

    const payload = updatedPayload as { nextDoseAt?: Date } | null;
    expect(payload).not.toBeNull();
    expect(payload?.nextDoseAt).toBeInstanceOf(Date);
    expect((payload?.nextDoseAt as Date).toISOString()).toBe(
      '2026-03-16T08:00:00.000Z',
    );
  });
});
