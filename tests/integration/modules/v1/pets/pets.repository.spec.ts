import '../../../../setup/integration.setup';
import { describe, expect, it } from 'bun:test';
import { prisma } from '@/lib/prisma';
import { PrismaPetsRepository } from '@/modules/v1/pets/repositories/prisma-pets.repository';
import { createPet, createUser } from '../../../../support/factories';

describe('PrismaPetsRepository', () => {
  it('lists history in reverse chronological order', async () => {
    const owner = await createUser();
    const pet = await createPet({ primaryTutorId: owner.id });

    await prisma.feedingRecords.create({
      data: {
        petId: pet.id,
        type: 'FEED',
        description: 'Racao',
        startsAt: new Date('2026-03-10T10:00:00.000Z'),
        isActive: false,
        createdByUserId: owner.id,
      },
    });

    await prisma.weightRecords.create({
      data: {
        petId: pet.id,
        weightGrams: 5100,
        measuredAt: new Date('2026-03-12T10:00:00.000Z'),
        createdByUserId: owner.id,
      },
    });

    await prisma.consultations.create({
      data: {
        petId: pet.id,
        occurredAt: new Date('2026-03-11T10:00:00.000Z'),
        clinicName: 'Clinica A',
        vetName: 'Dra. Maria',
        createdByUserId: owner.id,
      },
    });

    const repository = new PrismaPetsRepository(prisma);
    const history = await repository.listHistory(pet.id);

    expect(history.length).toBeGreaterThanOrEqual(3);

    for (let index = 0; index < history.length - 1; index += 1) {
      const current = history[index];
      const next = history[index + 1];

      expect(current.eventAt.getTime()).toBeGreaterThanOrEqual(next.eventAt.getTime());
    }
  });
});
