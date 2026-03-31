export type DosageUnit = 'TABLET_FRACTION' | 'DROPS' | 'ML' | 'UNIT' | 'OTHER';
export type FrequencyUnit = 'HOURS' | 'DAYS' | 'WEEKS';
export type PrescriptionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELED';

export type PrescriptionInput = {
  petId: string;
  medicationId?: string;
  medicationName?: string;
  medicationDescription?: string;
  dosageValue: number;
  dosageUnit: DosageUnit;
  dosageOtherDescription?: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  startsAt: Date;
  reminderEnabled?: boolean;
};

export type PrescriptionUpdateInput = {
  version: number;
  reminderEnabled?: boolean;
  status?: PrescriptionStatus;
  startsAt?: Date;
  frequencyValue?: number;
  frequencyUnit?: FrequencyUnit;
};

export type DoseRecordInput = {
  takenAt: Date;
  prescriptionVersion: number;
  notes?: string;
};
