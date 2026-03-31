import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import { PrescriptionsService } from '@/modules/v1/prescriptions/prescriptions.service';
import type { IPrescriptionsRepository } from '@/modules/v1/prescriptions/repositories/prescriptions-interfaces.repository';

function makeRepositoryMock(
  overrides?: Partial<IPrescriptionsRepository>,
): IPrescriptionsRepository {
  return {
    resolveUserRoleForPet: async () => 'CO_TUTOR',
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
    createPrescription: async () => ({ id: 'pres-1' }),
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

describe('PrescriptionsService - dose calculation', () => {
  it('recalculates nextDoseAt for non-retroactive taken dose', async () => {
    let nextDoseUpdatedAt: Date | null = null;

    const service = new PrescriptionsService(
      makeRepositoryMock({
        findLatestTakenDose: async () => ({
          takenAt: new Date('2026-03-13T07:00:00.000Z'),
        }),
        updatePrescriptionNextDose: async (_, nextDoseAt) => {
          nextDoseUpdatedAt = nextDoseAt;
        },
      }),
    );

    const takenAt = new Date('2026-03-13T10:00:00.000Z');
    const result = await service.createDoseRecord('user-1', 'pres-1', {
      takenAt,
      prescriptionVersion: 1,
      notes: 'ok',
    });

    expect(result).toMatchObject({
      status: 'TAKEN',
      isRetroactive: false,
      nextDoseRecalculated: true,
    });
    const recalculated = nextDoseUpdatedAt as Date | null;
    expect(recalculated).toBeInstanceOf(Date);
    expect((recalculated as Date).toISOString()).toBe('2026-03-13T18:00:00.000Z');
  });

  it('keeps schedule unchanged for retroactive dose and marks as LATE', async () => {
    let nextDoseUpdateCalls = 0;

    const service = new PrescriptionsService(
      makeRepositoryMock({
        findLatestTakenDose: async () => ({
          takenAt: new Date('2026-03-13T14:00:00.000Z'),
        }),
        updatePrescriptionNextDose: async () => {
          nextDoseUpdateCalls += 1;
        },
      }),
    );

    const result = await service.createDoseRecord('user-1', 'pres-1', {
      takenAt: new Date('2026-03-13T09:00:00.000Z'),
      prescriptionVersion: 1,
      notes: 'retroativo',
    });

    expect(result).toMatchObject({
      status: 'LATE',
      isRetroactive: true,
      nextDoseRecalculated: false,
    });
    expect(nextDoseUpdateCalls).toBe(0);
  });
});
