import { HttpError } from '@/lib/http/error-handler';
import { ensureRolePermission } from '@/lib/http/permissions';
import type { IFilesRepository } from '../files/repositories/files-interfaces.repository';
import type {
  ClinicalRecordType,
  ClinicalRecordUpdateInput,
  ConsultationInput,
  ExamInput,
  FeedingRecordInput,
  Pet,
  PetCreateInput,
  PetPatchPersistenceInput,
  PetSpecies,
  PetWithHealthSummary,
  SanitaryRecordInput,
  UpdatePetByIdInput,
  VaccinationInput,
  WeightRecordInput,
} from './pets.types';
import { createPetSpeciesValues } from './pets.types';
import type { IPetsRepository } from './repositories/pets-interfaces.repository';

const CLINICAL_WRITER_ROLES = new Set(['PRIMARY_TUTOR', 'CO_TUTOR']);
const PET_UPDATE_CONTEXT = 'pets.updateById';
const CREATE_PET_ALLOWED_SPECIES = new Set<string>(createPetSpeciesValues);

type PatchLogger = {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
};

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

export class PetsService {
  constructor(
    private readonly petsRepository: IPetsRepository,
    private readonly filesRepository: IFilesRepository,
  ) {}

  private async ensurePetAccess(petId: string, userId: string) {
    const pet = await this.petsRepository.findPetById(petId);

    if (!pet) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Pet not found');
    }

    const role = await this.petsRepository.resolveUserRoleForPet(petId, userId);

    if (!role) {
      throw new HttpError(403, 'FORBIDDEN', 'User has no access to this pet');
    }

    return { pet, role };
  }

  private async ensureClinicalWriter(petId: string, userId: string) {
    const { role } = await this.ensurePetAccess(petId, userId);

    if (!CLINICAL_WRITER_ROLES.has(role)) {
      ensureRolePermission(role, 'canManageClinicalRecords');
    }

    return role;
  }

  private ensureSpeciesAllowed(species: string): PetSpecies {
    if (!CREATE_PET_ALLOWED_SPECIES.has(species)) {
      throw new HttpError(
        400,
        'BAD_REQUEST',
        'Invalid species. Allowed values: Canine, Feline',
      );
    }

    return species as PetSpecies;
  }

  async getPetById(petId: string, userId: string): Promise<PetWithHealthSummary> {
    const pet = await this.petsRepository.getPetWithHealthSummary(petId);

    if (!pet) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Pet not found');
    }

    if (pet.primaryTutorId !== userId) {
      const relation = await this.petsRepository.findCareRelation(petId, userId);

      if (!relation || relation.status !== 'ACTIVE') {
        throw new HttpError(403, 'FORBIDDEN', 'You do not have access to this pet');
      }
    }

    return pet;
  }

  async createPet(userId: string, input: PetCreateInput) {
    const species = this.ensureSpeciesAllowed(input.species);

    return this.petsRepository.createPet(userId, {
      ...input,
      species,
    });
  }

  async listPets(userId: string) {
    return this.petsRepository.listByResponsibleUser(userId);
  }

  private buildPetPatchPersistenceData(
    input: UpdatePetByIdInput,
  ): PetPatchPersistenceInput['data'] {
    const data: PetPatchPersistenceInput['data'] = {};

    if (typeof input.name !== 'undefined') {
      data.name = input.name;
    }

    if (typeof input.species !== 'undefined') {
      data.species = this.ensureSpeciesAllowed(input.species);
    }

    if (typeof input.breed !== 'undefined') {
      data.breed = input.breed;
    }

    if (typeof input.birthDate !== 'undefined') {
      data.birthDate = input.birthDate;
    }

    if (typeof input.sex !== 'undefined') {
      data.sex = input.sex;
    }

    if (typeof input.observations !== 'undefined') {
      data.notes = input.observations;
    }

    return data;
  }

  async updatePetById(
    petId: string,
    userId: string,
    input: UpdatePetByIdInput,
    context?: {
      traceId?: string;
      log?: PatchLogger;
    },
  ): Promise<Pet> {
    const traceId = context?.traceId || 'unknown';
    const pet = await this.petsRepository.findPetById(petId);

    if (!pet) {
      context?.log?.warn(
        {
          context: PET_UPDATE_CONTEXT,
          traceId,
          petId,
          actorUserId: userId,
        },
        'Patch update denied: pet not found',
      );
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Pet not found');
    }

    if (pet.primaryTutorId !== userId) {
      const relation = await this.petsRepository.findCareRelation(petId, userId);

      if (!relation || relation.status !== 'ACTIVE') {
        context?.log?.warn(
          {
            context: PET_UPDATE_CONTEXT,
            traceId,
            petId,
            actorUserId: userId,
          },
          'Patch update denied: actor has no permission',
        );
        throw new HttpError(403, 'FORBIDDEN', 'You do not have access to this pet');
      }
    }

    const data = this.buildPetPatchPersistenceData(input);

    if (!Object.keys(data).length) {
      throw new HttpError(
        400,
        'BAD_REQUEST',
        'At least one field is required for patch update',
      );
    }

    const updatedPet = await this.petsRepository.updatePetByIdOptimistic({
      petId,
      expectedUpdatedAt: input.expectedUpdatedAt,
      data,
    });

    if (!updatedPet) {
      throw new HttpError(409, 'CONFLICT', 'Pet update conflict');
    }

    context?.log?.info(
      {
        context: PET_UPDATE_CONTEXT,
        traceId,
        petId,
        actorUserId: userId,
      },
      'Patch update completed',
    );

    return updatedPet;
  }

  async createFeeding(petId: string, userId: string, input: FeedingRecordInput) {
    await this.ensureClinicalWriter(petId, userId);

    const activeFeeding = await this.petsRepository.findActiveFeeding(petId);

    if (activeFeeding) {
      await this.petsRepository.closeFeeding(activeFeeding.id, input.startsAt);
    }

    return this.petsRepository.createFeeding(petId, userId, input);
  }

  async createWeight(petId: string, userId: string, input: WeightRecordInput) {
    await this.ensureClinicalWriter(petId, userId);

    return this.petsRepository.createWeight(petId, userId, input);
  }

  async createConsultation(petId: string, userId: string, input: ConsultationInput) {
    await this.ensureClinicalWriter(petId, userId);

    return this.petsRepository.createConsultation(petId, userId, input);
  }

  async createExam(petId: string, userId: string, input: ExamInput) {
    await this.ensureClinicalWriter(petId, userId);

    const storedFiles = await this.filesRepository.findByIds(input.fileIds);

    if (storedFiles.length !== input.fileIds.length) {
      throw new HttpError(422, 'UNPROCESSABLE_ENTITY', 'Some files were not found');
    }

    const hasInvalidAttachment = storedFiles.some(
      (file) => file.petId !== petId || file.domain !== 'EXAM',
    );

    if (hasInvalidAttachment) {
      throw new HttpError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Exam accepts only EXAM files from same pet',
      );
    }

    const exam = await this.petsRepository.createExam(petId, userId, {
      type: input.type,
      occurredAt: input.occurredAt,
      notes: input.notes,
    });

    await this.petsRepository.createExamAttachments(exam.id, input.fileIds);

    return {
      ...exam,
      fileIds: input.fileIds,
    };
  }

  async createVaccination(petId: string, userId: string, input: VaccinationInput) {
    await this.ensureClinicalWriter(petId, userId);

    if (input.fileId) {
      const [storedFile] = await this.filesRepository.findByIds([input.fileId]);

      if (
        !storedFile ||
        storedFile.petId !== petId ||
        storedFile.domain !== 'VACCINATION'
      ) {
        throw new HttpError(
          422,
          'UNPROCESSABLE_ENTITY',
          'Vaccination attachment must be a VACCINATION file from the same pet',
        );
      }
    }

    return this.petsRepository.createVaccination(petId, userId, input);
  }

  async createSanitaryRecord(
    petId: string,
    userId: string,
    input: SanitaryRecordInput,
  ) {
    await this.ensureClinicalWriter(petId, userId);

    return this.petsRepository.createSanitaryRecord(petId, userId, input);
  }

  async listHistory(petId: string, userId: string) {
    await this.ensurePetAccess(petId, userId);

    const history = await this.petsRepository.listHistory(petId);

    return history.map((item) => ({
      petId,
      recordType: item.recordType,
      recordId: item.recordId,
      eventAt: item.eventAt,
      version: item.version,
      payload: item.payload,
    }));
  }

  private sanitizePayload(
    recordType: ClinicalRecordType,
    payload: Record<string, unknown>,
  ) {
    if (recordType === 'FEEDING') {
      return {
        type: typeof payload.type === 'string' ? payload.type : undefined,
        description:
          typeof payload.description === 'string' ? payload.description : undefined,
        startsAt: toDate(payload.startsAt),
        endsAt: toDate(payload.endsAt),
        isActive: typeof payload.isActive === 'boolean' ? payload.isActive : undefined,
      };
    }

    if (recordType === 'WEIGHT') {
      return {
        weightGrams:
          typeof payload.weightGrams === 'number' ? payload.weightGrams : undefined,
        measuredAt: toDate(payload.measuredAt),
        note: typeof payload.note === 'string' ? payload.note : undefined,
      };
    }

    if (recordType === 'CONSULTATION') {
      return {
        occurredAt: toDate(payload.occurredAt),
        clinicName:
          typeof payload.clinicName === 'string' ? payload.clinicName : undefined,
        vetName: typeof payload.vetName === 'string' ? payload.vetName : undefined,
        notes: typeof payload.notes === 'string' ? payload.notes : undefined,
      };
    }

    if (recordType === 'EXAM') {
      return {
        type: typeof payload.type === 'string' ? payload.type : undefined,
        occurredAt: toDate(payload.occurredAt),
        notes: typeof payload.notes === 'string' ? payload.notes : undefined,
      };
    }

    if (recordType === 'VACCINATION') {
      return {
        vaccineName:
          typeof payload.vaccineName === 'string' ? payload.vaccineName : undefined,
        appliedAt: toDate(payload.appliedAt),
        vetName: typeof payload.vetName === 'string' ? payload.vetName : undefined,
        nextDoseAt: toDate(payload.nextDoseAt),
        reminderEnabled:
          typeof payload.reminderEnabled === 'boolean'
            ? payload.reminderEnabled
            : undefined,
        nextDoseReminderAt: toDate(payload.nextDoseReminderAt),
        notes: typeof payload.notes === 'string' ? payload.notes : undefined,
        fileId: typeof payload.fileId === 'string' ? payload.fileId : undefined,
      };
    }

    return {
      category: typeof payload.category === 'string' ? payload.category : undefined,
      productName:
        typeof payload.productName === 'string' ? payload.productName : undefined,
      appliedAt: toDate(payload.appliedAt),
      nextApplicationAt: toDate(payload.nextApplicationAt),
      reminderEnabled:
        typeof payload.reminderEnabled === 'boolean'
          ? payload.reminderEnabled
          : undefined,
      notes: typeof payload.notes === 'string' ? payload.notes : undefined,
    };
  }

  async updateClinicalRecord(
    petId: string,
    userId: string,
    recordType: ClinicalRecordType,
    recordId: string,
    input: ClinicalRecordUpdateInput,
  ) {
    await this.ensureClinicalWriter(petId, userId);

    const sanitizedPayload = Object.fromEntries(
      Object.entries(this.sanitizePayload(recordType, input.payload)).filter(
        ([, value]) => value !== undefined,
      ),
    );

    if (!Object.keys(sanitizedPayload).length) {
      throw new HttpError(422, 'UNPROCESSABLE_ENTITY', 'No valid fields to update');
    }

    const updated = await this.petsRepository.updateClinicalRecord({
      petId,
      recordType,
      recordId,
      version: input.version,
      payload: sanitizedPayload,
    });

    if (!updated) {
      throw new HttpError(409, 'CONFLICT', 'Clinical record version conflict');
    }

    return {
      petId,
      recordType,
      recordId,
      eventAt: updated.eventAt,
      version: updated.version,
      payload: updated.payload,
    };
  }
}
