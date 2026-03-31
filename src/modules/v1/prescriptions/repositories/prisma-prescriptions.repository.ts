import type { PrismaClient } from '@/lib/prisma';
import type {
  IPrescriptionsRepository,
  PetRole,
} from './prescriptions-interfaces.repository';

export class PrismaPrescriptionsRepository implements IPrescriptionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveUserRoleForPet(petId: string, userId: string): Promise<PetRole> {
    const pet = await this.prisma.pets.findUnique({
      where: { id: petId },
      select: { primaryTutorId: true },
    });

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

    return relation?.role ?? null;
  }

  async findMedicationById(medicationId: string) {
    return this.prisma.medications.findUnique({
      where: {
        id: medicationId,
      },
      select: {
        id: true,
        name: true,
        catalogScope: true,
        ownerUserId: true,
      },
    });
  }

  async findOrCreateTutorMedication(input: {
    name: string;
    description?: string;
    ownerUserId: string;
  }) {
    const existing = await this.prisma.medications.findFirst({
      where: {
        name: input.name,
        catalogScope: 'TUTOR',
        ownerUserId: input.ownerUserId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.medications.create({
      data: {
        name: input.name,
        description: input.description,
        catalogScope: 'TUTOR',
        ownerUserId: input.ownerUserId,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async createPrescription(input: {
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
  }) {
    return this.prisma.prescriptions.create({
      data: {
        petId: input.petId,
        medicationId: input.medicationId,
        dosageValue: input.dosageValue,
        dosageUnit: input.dosageUnit,
        dosageOtherDescription: input.dosageOtherDescription,
        frequencyValue: input.frequencyValue,
        frequencyUnit: input.frequencyUnit,
        startsAt: input.startsAt,
        nextDoseAt: input.nextDoseAt,
        reminderEnabled: input.reminderEnabled,
        createdByUserId: input.createdByUserId,
      },
    });
  }

  async findPrescriptionById(prescriptionId: string) {
    return this.prisma.prescriptions.findUnique({
      where: { id: prescriptionId },
    });
  }

  async updatePrescription(input: {
    prescriptionId: string;
    version: number;
    payload: Record<string, unknown>;
  }) {
    const updated = await this.prisma.prescriptions.updateMany({
      where: {
        id: input.prescriptionId,
        version: input.version,
      },
      data: {
        ...(input.payload as {
          reminderEnabled?: boolean;
          status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELED';
          startsAt?: Date;
          frequencyValue?: number;
          frequencyUnit?: 'HOURS' | 'DAYS' | 'WEEKS';
          nextDoseAt?: Date;
        }),
        version: {
          increment: 1,
        },
      },
    });

    if (!updated.count) {
      return null;
    }

    return this.prisma.prescriptions.findUnique({
      where: { id: input.prescriptionId },
    });
  }

  async findLatestTakenDose(prescriptionId: string) {
    return this.prisma.doseRecords.findFirst({
      where: {
        prescriptionId,
      },
      orderBy: {
        takenAt: 'desc',
      },
      select: {
        takenAt: true,
      },
    });
  }

  async createDoseRecord(input: {
    prescriptionId: string;
    petId: string;
    scheduledFor: Date;
    takenAt: Date;
    status: 'TAKEN' | 'LATE' | 'SKIPPED';
    isRetroactive: boolean;
    notes?: string;
    createdByUserId: string;
  }) {
    return this.prisma.doseRecords.create({
      data: {
        prescriptionId: input.prescriptionId,
        petId: input.petId,
        scheduledFor: input.scheduledFor,
        takenAt: input.takenAt,
        status: input.status,
        isRetroactive: input.isRetroactive,
        notes: input.notes,
        createdByUserId: input.createdByUserId,
      },
    });
  }

  async updatePrescriptionNextDose(prescriptionId: string, nextDoseAt: Date) {
    await this.prisma.prescriptions.update({
      where: {
        id: prescriptionId,
      },
      data: {
        nextDoseAt,
      },
    });
  }

  async listMedicationAgenda(petId: string, from: Date, to: Date) {
    const prescriptions = await this.prisma.prescriptions.findMany({
      where: {
        petId,
        status: 'ACTIVE',
        nextDoseAt: {
          gte: from,
          lt: to,
        },
      },
      include: {
        medication: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        nextDoseAt: 'asc',
      },
    });

    return prescriptions.map((prescription) => ({
      prescriptionId: prescription.id,
      medicationName: prescription.medication.name,
      nextDoseAt: prescription.nextDoseAt,
      dosageLabel: `${prescription.dosageValue.toString()} ${prescription.dosageUnit}`,
    }));
  }
}
