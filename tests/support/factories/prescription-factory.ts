import { prisma } from '@/lib/prisma';

export async function createPrescription(input: {
  petId: string;
  medicationId: string;
  createdByUserId: string;
  startsAt?: Date;
  nextDoseAt?: Date;
  frequencyValue?: number;
  frequencyUnit?: 'HOURS' | 'DAYS' | 'WEEKS';
  dosageValue?: number;
  dosageUnit?: 'TABLET_FRACTION' | 'DROPS' | 'ML' | 'UNIT' | 'OTHER';
  version?: number;
}) {
  const startsAt = input.startsAt || new Date('2026-03-13T08:00:00.000Z');

  return prisma.prescriptions.create({
    data: {
      petId: input.petId,
      medicationId: input.medicationId,
      dosageValue: input.dosageValue || 1,
      dosageUnit: input.dosageUnit || 'UNIT',
      frequencyValue: input.frequencyValue || 8,
      frequencyUnit: input.frequencyUnit || 'HOURS',
      startsAt,
      nextDoseAt: input.nextDoseAt || startsAt,
      reminderEnabled: true,
      status: 'ACTIVE',
      createdByUserId: input.createdByUserId,
      version: input.version || 1,
    },
  });
}
