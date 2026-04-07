import type { PrismaClient } from '@/lib/prisma';
import type { PetWithHealthSummary } from '../pets.types';
import type { IPetsRepository, PetRole } from './pets-interfaces.repository';

export class PrismaPetsRepository implements IPetsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createPet(
    userId: string,
    input: {
      name: string;
      species: string;
      breed?: string;
      birthDate?: Date;
      sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
      notes?: string;
    },
  ) {
    return this.prisma.pets.create({
      data: {
        name: input.name,
        species: input.species,
        breed: input.breed,
        birthDate: input.birthDate,
        sex: input.sex,
        notes: input.notes,
        primaryTutorId: userId,
      },
    });
  }

  async listByResponsibleUser(userId: string) {
    const ownedPets = await this.prisma.pets.findMany({
      where: {
        primaryTutorId: userId,
      },
    });

    const relations = await this.prisma.careRelations.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        petId: true,
      },
    });

    const relatedPetIds = relations.map((relation) => relation.petId);
    const relatedPets = relatedPetIds.length
      ? await this.prisma.pets.findMany({
          where: {
            id: {
              in: relatedPetIds,
            },
          },
        })
      : [];

    const allPets = [...ownedPets, ...relatedPets];
    const uniqueById = new Map(allPets.map((pet) => [pet.id, pet]));

    return [...uniqueById.values()];
  }

  async findPetById(petId: string) {
    return this.prisma.pets.findUnique({
      where: { id: petId },
    });
  }

  async resolveUserRoleForPet(petId: string, userId: string): Promise<PetRole> {
    const pet = await this.findPetById(petId);

    if (!pet) {
      return null;
    }

    if (pet.primaryTutorId === userId) {
      return 'PRIMARY_TUTOR';
    }

    const relation = await this.prisma.careRelations.findFirst({
      where: {
        petId,
        userId,
        status: 'ACTIVE',
      },
      select: {
        role: true,
      },
    });

    if (!relation) {
      return null;
    }

    return relation.role;
  }

  async getPetWithHealthSummary(petId: string): Promise<PetWithHealthSummary | null> {
    const pet = await this.prisma.pets.findUnique({
      where: { id: petId },
      include: {
        WeightRecords: {
          orderBy: { measuredAt: 'desc' },
          take: 1,
          select: {
            id: true,
            weightGrams: true,
            measuredAt: true,
            note: true,
            version: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Vaccinations: {
          orderBy: { appliedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            vaccineName: true,
            appliedAt: true,
            vetName: true,
            nextDoseAt: true,
            reminderEnabled: true,
            nextDoseReminderAt: true,
            notes: true,
            fileId: true,
            version: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Consultations: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
          select: {
            id: true,
            occurredAt: true,
            clinicName: true,
            vetName: true,
            notes: true,
            version: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        SanitaryRecords: {
          orderBy: { appliedAt: 'desc' },
          select: {
            id: true,
            category: true,
            productName: true,
            appliedAt: true,
            nextApplicationAt: true,
            reminderEnabled: true,
            notes: true,
            version: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        FeedingRecords: {
          orderBy: { startsAt: 'desc' },
          take: 1,
          select: {
            id: true,
            type: true,
            description: true,
            startsAt: true,
            endsAt: true,
            isActive: true,
            version: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!pet) {
      return null;
    }

    const dewormers = pet.SanitaryRecords.filter((r) => r.category === 'DEWORMER');
    const antiparasitics = pet.SanitaryRecords.filter(
      (r) => r.category === 'ANTIPARASITIC',
    );

    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      birthDate: pet.birthDate,
      sex: pet.sex,
      notes: pet.notes,
      primaryTutorId: pet.primaryTutorId,
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt,
      healthSummary: {
        lastWeight: pet.WeightRecords[0] ?? null,
        lastVaccination: pet.Vaccinations[0] ?? null,
        lastConsultation: pet.Consultations[0] ?? null,
        lastDewormer: dewormers[0] ?? null,
        lastAntiparasitic: antiparasitics[0] ?? null,
        lastFeeding: pet.FeedingRecords[0] ?? null,
      },
    };
  }

  async findCareRelation(petId: string, userId: string) {
    return this.prisma.careRelations.findUnique({
      where: {
        petId_userId: { petId, userId },
      },
      select: {
        status: true,
      },
    });
  }

  async findActiveFeeding(petId: string) {
    return this.prisma.feedingRecords.findFirst({
      where: {
        petId,
        isActive: true,
      },
      select: {
        id: true,
      },
      orderBy: {
        startsAt: 'desc',
      },
    });
  }

  async closeFeeding(recordId: string, endsAt: Date) {
    await this.prisma.feedingRecords.update({
      where: {
        id: recordId,
      },
      data: {
        endsAt,
        isActive: false,
        version: {
          increment: 1,
        },
      },
    });
  }

  async createFeeding(
    petId: string,
    userId: string,
    input: {
      type: 'FEED' | 'NATURAL' | 'MIXED' | 'OTHER';
      description: string;
      startsAt: Date;
    },
  ) {
    return this.prisma.feedingRecords.create({
      data: {
        petId,
        type: input.type,
        description: input.description,
        startsAt: input.startsAt,
        createdByUserId: userId,
        isActive: true,
      },
    });
  }

  async createWeight(
    petId: string,
    userId: string,
    input: { weightGrams: number; measuredAt: Date; note?: string },
  ) {
    return this.prisma.weightRecords.create({
      data: {
        petId,
        weightGrams: input.weightGrams,
        measuredAt: input.measuredAt,
        note: input.note,
        createdByUserId: userId,
      },
    });
  }

  async createConsultation(
    petId: string,
    userId: string,
    input: { occurredAt: Date; clinicName?: string; vetName?: string; notes?: string },
  ) {
    return this.prisma.consultations.create({
      data: {
        petId,
        occurredAt: input.occurredAt,
        clinicName: input.clinicName,
        vetName: input.vetName,
        notes: input.notes,
        createdByUserId: userId,
      },
    });
  }

  async createExam(
    petId: string,
    userId: string,
    input: { type: string; occurredAt: Date; notes?: string },
  ) {
    return this.prisma.exams.create({
      data: {
        petId,
        type: input.type,
        occurredAt: input.occurredAt,
        notes: input.notes,
        createdByUserId: userId,
      },
    });
  }

  async createExamAttachments(examId: string, fileIds: string[]) {
    if (fileIds.length === 0) {
      return;
    }

    await this.prisma.examAttachments.createMany({
      data: fileIds.map((fileId) => ({
        examId,
        storedFileId: fileId,
      })),
      skipDuplicates: true,
    });
  }

  async createVaccination(
    petId: string,
    userId: string,
    input: {
      vaccineName: string;
      appliedAt: Date;
      vetName: string;
      nextDoseAt?: Date;
      reminderEnabled: boolean;
      nextDoseReminderAt?: Date;
      notes?: string;
      fileId?: string;
    },
  ) {
    return this.prisma.vaccinations.create({
      data: {
        petId,
        vaccineName: input.vaccineName,
        appliedAt: input.appliedAt,
        vetName: input.vetName,
        nextDoseAt: input.nextDoseAt,
        reminderEnabled: input.reminderEnabled,
        nextDoseReminderAt: input.nextDoseReminderAt,
        notes: input.notes,
        fileId: input.fileId,
        createdByUserId: userId,
      },
    });
  }

  async createSanitaryRecord(
    petId: string,
    userId: string,
    input: {
      category: 'DEWORMER' | 'ANTIPARASITIC';
      productName: string;
      appliedAt: Date;
      nextApplicationAt?: Date;
      reminderEnabled: boolean;
      notes?: string;
    },
  ) {
    return this.prisma.sanitaryRecords.create({
      data: {
        petId,
        category: input.category,
        productName: input.productName,
        appliedAt: input.appliedAt,
        nextApplicationAt: input.nextApplicationAt,
        reminderEnabled: input.reminderEnabled,
        notes: input.notes,
        createdByUserId: userId,
      },
    });
  }

  async listHistory(petId: string) {
    const [
      feedingRecords,
      weightRecords,
      consultations,
      exams,
      vaccinations,
      sanitaryRecords,
    ] = await Promise.all([
      this.prisma.feedingRecords.findMany({ where: { petId } }),
      this.prisma.weightRecords.findMany({ where: { petId } }),
      this.prisma.consultations.findMany({ where: { petId } }),
      this.prisma.exams.findMany({ where: { petId } }),
      this.prisma.vaccinations.findMany({ where: { petId } }),
      this.prisma.sanitaryRecords.findMany({ where: { petId } }),
    ]);

    const history = [
      ...feedingRecords.map((record) => ({
        recordType: 'FEEDING' as const,
        recordId: record.id,
        eventAt: record.startsAt,
        version: record.version,
        payload: {
          type: record.type,
          description: record.description,
          startsAt: record.startsAt,
          endsAt: record.endsAt,
          isActive: record.isActive,
        },
      })),
      ...weightRecords.map((record) => ({
        recordType: 'WEIGHT' as const,
        recordId: record.id,
        eventAt: record.measuredAt,
        version: record.version,
        payload: {
          weightGrams: record.weightGrams,
          measuredAt: record.measuredAt,
          note: record.note,
        },
      })),
      ...consultations.map((record) => ({
        recordType: 'CONSULTATION' as const,
        recordId: record.id,
        eventAt: record.occurredAt,
        version: record.version,
        payload: {
          occurredAt: record.occurredAt,
          clinicName: record.clinicName,
          vetName: record.vetName,
          notes: record.notes,
        },
      })),
      ...exams.map((record) => ({
        recordType: 'EXAM' as const,
        recordId: record.id,
        eventAt: record.occurredAt,
        version: record.version,
        payload: {
          type: record.type,
          occurredAt: record.occurredAt,
          notes: record.notes,
        },
      })),
      ...vaccinations.map((record) => ({
        recordType: 'VACCINATION' as const,
        recordId: record.id,
        eventAt: record.appliedAt,
        version: record.version,
        payload: {
          vaccineName: record.vaccineName,
          appliedAt: record.appliedAt,
          vetName: record.vetName,
          nextDoseAt: record.nextDoseAt,
          reminderEnabled: record.reminderEnabled,
          nextDoseReminderAt: record.nextDoseReminderAt,
          notes: record.notes,
        },
      })),
      ...sanitaryRecords.map((record) => ({
        recordType: 'SANITARY' as const,
        recordId: record.id,
        eventAt: record.appliedAt,
        version: record.version,
        payload: {
          category: record.category,
          productName: record.productName,
          appliedAt: record.appliedAt,
          nextApplicationAt: record.nextApplicationAt,
          reminderEnabled: record.reminderEnabled,
          notes: record.notes,
        },
      })),
    ];

    history.sort((a, b) => b.eventAt.getTime() - a.eventAt.getTime());

    return history;
  }

  async updateClinicalRecord(input: {
    petId: string;
    recordType:
      | 'FEEDING'
      | 'WEIGHT'
      | 'CONSULTATION'
      | 'EXAM'
      | 'VACCINATION'
      | 'SANITARY';
    recordId: string;
    version: number;
    payload: Record<string, unknown>;
  }) {
    if (input.recordType === 'FEEDING') {
      const result = await this.prisma.feedingRecords.updateMany({
        where: {
          id: input.recordId,
          petId: input.petId,
          version: input.version,
        },
        data: {
          ...(input.payload as {
            type?: 'FEED' | 'NATURAL' | 'MIXED' | 'OTHER';
            description?: string;
            startsAt?: Date;
            endsAt?: Date;
            isActive?: boolean;
          }),
          version: {
            increment: 1,
          },
        },
      });

      if (!result.count) {
        return null;
      }

      const updated = await this.prisma.feedingRecords.findUnique({
        where: { id: input.recordId },
      });

      if (!updated) {
        return null;
      }

      return {
        eventAt: updated.startsAt,
        version: updated.version,
        payload: {
          type: updated.type,
          description: updated.description,
          startsAt: updated.startsAt,
          endsAt: updated.endsAt,
          isActive: updated.isActive,
        },
      };
    }

    if (input.recordType === 'WEIGHT') {
      const result = await this.prisma.weightRecords.updateMany({
        where: {
          id: input.recordId,
          petId: input.petId,
          version: input.version,
        },
        data: {
          ...(input.payload as {
            weightGrams?: number;
            measuredAt?: Date;
            note?: string;
          }),
          version: {
            increment: 1,
          },
        },
      });

      if (!result.count) {
        return null;
      }

      const updated = await this.prisma.weightRecords.findUnique({
        where: { id: input.recordId },
      });

      if (!updated) {
        return null;
      }

      return {
        eventAt: updated.measuredAt,
        version: updated.version,
        payload: {
          weightGrams: updated.weightGrams,
          measuredAt: updated.measuredAt,
          note: updated.note,
        },
      };
    }

    if (input.recordType === 'CONSULTATION') {
      const result = await this.prisma.consultations.updateMany({
        where: {
          id: input.recordId,
          petId: input.petId,
          version: input.version,
        },
        data: {
          ...(input.payload as {
            occurredAt?: Date;
            clinicName?: string;
            vetName?: string;
            notes?: string;
          }),
          version: {
            increment: 1,
          },
        },
      });

      if (!result.count) {
        return null;
      }

      const updated = await this.prisma.consultations.findUnique({
        where: { id: input.recordId },
      });

      if (!updated) {
        return null;
      }

      return {
        eventAt: updated.occurredAt,
        version: updated.version,
        payload: {
          occurredAt: updated.occurredAt,
          clinicName: updated.clinicName,
          vetName: updated.vetName,
          notes: updated.notes,
        },
      };
    }

    if (input.recordType === 'EXAM') {
      const result = await this.prisma.exams.updateMany({
        where: {
          id: input.recordId,
          petId: input.petId,
          version: input.version,
        },
        data: {
          ...(input.payload as {
            type?: string;
            occurredAt?: Date;
            notes?: string;
          }),
          version: {
            increment: 1,
          },
        },
      });

      if (!result.count) {
        return null;
      }

      const updated = await this.prisma.exams.findUnique({
        where: { id: input.recordId },
      });

      if (!updated) {
        return null;
      }

      return {
        eventAt: updated.occurredAt,
        version: updated.version,
        payload: {
          type: updated.type,
          occurredAt: updated.occurredAt,
          notes: updated.notes,
        },
      };
    }

    if (input.recordType === 'VACCINATION') {
      const result = await this.prisma.vaccinations.updateMany({
        where: {
          id: input.recordId,
          petId: input.petId,
          version: input.version,
        },
        data: {
          ...(input.payload as {
            vaccineName?: string;
            appliedAt?: Date;
            vetName?: string;
            nextDoseAt?: Date;
            reminderEnabled?: boolean;
            nextDoseReminderAt?: Date;
            notes?: string;
            fileId?: string;
          }),
          version: {
            increment: 1,
          },
        },
      });

      if (!result.count) {
        return null;
      }

      const updated = await this.prisma.vaccinations.findUnique({
        where: { id: input.recordId },
      });

      if (!updated) {
        return null;
      }

      return {
        eventAt: updated.appliedAt,
        version: updated.version,
        payload: {
          vaccineName: updated.vaccineName,
          appliedAt: updated.appliedAt,
          vetName: updated.vetName,
          nextDoseAt: updated.nextDoseAt,
          reminderEnabled: updated.reminderEnabled,
          nextDoseReminderAt: updated.nextDoseReminderAt,
          notes: updated.notes,
          fileId: updated.fileId,
        },
      };
    }

    const result = await this.prisma.sanitaryRecords.updateMany({
      where: {
        id: input.recordId,
        petId: input.petId,
        version: input.version,
      },
      data: {
        ...(input.payload as {
          category?: 'DEWORMER' | 'ANTIPARASITIC';
          productName?: string;
          appliedAt?: Date;
          nextApplicationAt?: Date;
          reminderEnabled?: boolean;
          notes?: string;
        }),
        version: {
          increment: 1,
        },
      },
    });

    if (!result.count) {
      return null;
    }

    const updated = await this.prisma.sanitaryRecords.findUnique({
      where: { id: input.recordId },
    });

    if (!updated) {
      return null;
    }

    return {
      eventAt: updated.appliedAt,
      version: updated.version,
      payload: {
        category: updated.category,
        productName: updated.productName,
        appliedAt: updated.appliedAt,
        nextApplicationAt: updated.nextApplicationAt,
        reminderEnabled: updated.reminderEnabled,
        notes: updated.notes,
      },
    };
  }
}
