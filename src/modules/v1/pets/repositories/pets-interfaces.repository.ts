import type {
  ClinicalRecordType,
  ConsultationInput,
  ExamInput,
  FeedingRecordInput,
  Pet,
  PetCreateInput,
  SanitaryRecordInput,
  VaccinationInput,
  WeightRecordInput,
} from '../pets.types';

export type PetRole = 'PRIMARY_TUTOR' | 'CO_TUTOR' | 'CAREGIVER' | null;

export interface IPetsRepository {
  createPet(userId: string, input: PetCreateInput): Promise<Pet>;
  listByResponsibleUser(userId: string): Promise<Pet[]>;
  findPetById(petId: string): Promise<Pet | null>;
  resolveUserRoleForPet(petId: string, userId: string): Promise<PetRole>;

  findActiveFeeding(petId: string): Promise<{ id: string } | null>;
  closeFeeding(recordId: string, endsAt: Date): Promise<void>;

  createFeeding(
    petId: string,
    userId: string,
    input: FeedingRecordInput,
  ): Promise<Record<string, unknown>>;
  createWeight(
    petId: string,
    userId: string,
    input: WeightRecordInput,
  ): Promise<Record<string, unknown>>;
  createConsultation(
    petId: string,
    userId: string,
    input: ConsultationInput,
  ): Promise<Record<string, unknown>>;
  createExam(
    petId: string,
    userId: string,
    input: Omit<ExamInput, 'fileIds'>,
  ): Promise<{ id: string } & Record<string, unknown>>;
  createExamAttachments(examId: string, fileIds: string[]): Promise<void>;
  createVaccination(
    petId: string,
    userId: string,
    input: VaccinationInput,
  ): Promise<Record<string, unknown>>;
  createSanitaryRecord(
    petId: string,
    userId: string,
    input: SanitaryRecordInput,
  ): Promise<Record<string, unknown>>;

  listHistory(petId: string): Promise<
    Array<{
      recordType: ClinicalRecordType;
      recordId: string;
      eventAt: Date;
      version: number;
      payload: Record<string, unknown>;
    }>
  >;

  updateClinicalRecord(input: {
    petId: string;
    recordType: ClinicalRecordType;
    recordId: string;
    version: number;
    payload: Record<string, unknown>;
  }): Promise<{
    eventAt: Date;
    version: number;
    payload: Record<string, unknown>;
  } | null>;
}
