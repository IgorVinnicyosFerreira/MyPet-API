import type { FrequencyUnit, PrescriptionStatus } from '../prescriptions.types';

export type PetRole = 'PRIMARY_TUTOR' | 'CO_TUTOR' | 'CAREGIVER' | null;

export interface IPrescriptionsRepository {
  resolveUserRoleForPet(petId: string, userId: string): Promise<PetRole>;
  findMedicationById(medicationId: string): Promise<{
    id: string;
    name: string;
    catalogScope: 'GLOBAL' | 'TUTOR';
    ownerUserId: string | null;
  } | null>;
  findOrCreateTutorMedication(input: {
    name: string;
    description?: string;
    ownerUserId: string;
  }): Promise<{ id: string; name: string }>;
  createPrescription(input: {
    petId: string;
    medicationId: string;
    dosageValue: number;
    dosageUnit: 'TABLET_FRACTION' | 'DROPS' | 'ML' | 'UNIT' | 'OTHER';
    dosageOtherDescription?: string;
    frequencyValue: number;
    frequencyUnit: 'HOURS' | 'DAYS' | 'WEEKS';
    startsAt: Date;
    nextDoseAt: Date;
    reminderEnabled: boolean;
    createdByUserId: string;
  }): Promise<Record<string, unknown>>;
  findPrescriptionById(prescriptionId: string): Promise<{
    id: string;
    petId: string;
    medicationId: string;
    dosageValue: unknown;
    dosageUnit: 'TABLET_FRACTION' | 'DROPS' | 'ML' | 'UNIT' | 'OTHER';
    dosageOtherDescription: string | null;
    frequencyValue: number;
    frequencyUnit: FrequencyUnit;
    startsAt: Date;
    nextDoseAt: Date;
    reminderEnabled: boolean;
    status: PrescriptionStatus;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  } | null>;
  updatePrescription(input: {
    prescriptionId: string;
    version: number;
    payload: Record<string, unknown>;
  }): Promise<Record<string, unknown> | null>;
  findLatestTakenDose(prescriptionId: string): Promise<{ takenAt: Date } | null>;
  createDoseRecord(input: {
    prescriptionId: string;
    petId: string;
    scheduledFor: Date;
    takenAt: Date;
    status: 'TAKEN' | 'LATE' | 'SKIPPED';
    isRetroactive: boolean;
    notes?: string;
    createdByUserId: string;
  }): Promise<Record<string, unknown>>;
  updatePrescriptionNextDose(prescriptionId: string, nextDoseAt: Date): Promise<void>;
  listMedicationAgenda(
    petId: string,
    from: Date,
    to: Date,
  ): Promise<
    Array<{
      prescriptionId: string;
      medicationName: string;
      nextDoseAt: Date;
      dosageLabel: string;
    }>
  >;
}
