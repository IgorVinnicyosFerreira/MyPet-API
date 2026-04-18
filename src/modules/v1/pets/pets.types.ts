export const createPetSpeciesValues = ['Canine', 'Feline'] as const;

export type PetSpecies = (typeof createPetSpeciesValues)[number];

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
  species: PetSpecies;
  breed?: string;
  birthDate?: Date;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  notes?: string;
};

export type UpdatePetByIdInput = {
  expectedUpdatedAt: Date;
  name?: string;
  species?: PetSpecies;
  breed?: string | null;
  birthDate?: Date | null;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
  observations?: string | null;
};

export type PetPatchPersistenceInput = {
  petId: string;
  expectedUpdatedAt: Date;
  data: {
    name?: string;
    species?: PetSpecies;
    breed?: string | null;
    birthDate?: Date | null;
    sex?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
    notes?: string | null;
  };
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

export type WeightRecordSummary = {
  id: string;
  weightGrams: number;
  measuredAt: Date;
  note: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type VaccinationSummary = {
  id: string;
  vaccineName: string;
  appliedAt: Date;
  vetName: string;
  nextDoseAt: Date | null;
  reminderEnabled: boolean;
  nextDoseReminderAt: Date | null;
  notes: string | null;
  fileId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ConsultationSummary = {
  id: string;
  occurredAt: Date;
  clinicName: string | null;
  vetName: string | null;
  notes: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SanitaryRecordSummary = {
  id: string;
  category: 'DEWORMER' | 'ANTIPARASITIC';
  productName: string;
  appliedAt: Date;
  nextApplicationAt: Date | null;
  reminderEnabled: boolean;
  notes: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FeedingRecordSummary = {
  id: string;
  type: 'FEED' | 'NATURAL' | 'MIXED' | 'OTHER';
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type HealthSummary = {
  lastWeight: WeightRecordSummary | null;
  lastVaccination: VaccinationSummary | null;
  lastConsultation: ConsultationSummary | null;
  lastDewormer: SanitaryRecordSummary | null;
  lastAntiparasitic: SanitaryRecordSummary | null;
  lastFeeding: FeedingRecordSummary | null;
};

export type PetWithHealthSummary = Pet & {
  healthSummary: HealthSummary;
};
