export type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: Date | null;
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
  notes: string | null;
  primaryTutorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PetCreateInput = {
  name: string;
  species: string;
  breed?: string;
  birthDate?: Date;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  notes?: string;
};

export type FeedingRecordInput = {
  type: 'FEED' | 'NATURAL' | 'MIXED' | 'OTHER';
  description: string;
  startsAt: Date;
};

export type WeightRecordInput = {
  weightGrams: number;
  measuredAt: Date;
  note?: string;
};

export type ConsultationInput = {
  occurredAt: Date;
  clinicName?: string;
  vetName?: string;
  notes?: string;
};

export type ExamInput = {
  type: string;
  occurredAt: Date;
  notes?: string;
  fileIds: string[];
};

export type VaccinationInput = {
  vaccineName: string;
  appliedAt: Date;
  vetName: string;
  nextDoseAt?: Date;
  reminderEnabled: boolean;
  nextDoseReminderAt?: Date;
  notes?: string;
  fileId?: string;
};

export type SanitaryRecordInput = {
  category: 'DEWORMER' | 'ANTIPARASITIC';
  productName: string;
  appliedAt: Date;
  nextApplicationAt?: Date;
  reminderEnabled: boolean;
  notes?: string;
};

export type ClinicalRecordType =
  | 'FEEDING'
  | 'WEIGHT'
  | 'CONSULTATION'
  | 'EXAM'
  | 'VACCINATION'
  | 'SANITARY';

export type ClinicalRecordUpdateInput = {
  version: number;
  payload: Record<string, unknown>;
};

export type HistoryItem = {
  petId: string;
  recordType: ClinicalRecordType;
  recordId: string;
  eventAt: Date;
  version: number;
  payload: Record<string, unknown>;
};
