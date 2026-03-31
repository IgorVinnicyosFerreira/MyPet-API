import type { PrismaClient } from '@/lib/prisma';
import type { IDigitalWalletsRepository } from './digital-wallets-interfaces.repository';

export class PrismaDigitalWalletsRepository implements IDigitalWalletsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveUserAccess(petId: string, userId: string) {
    const pet = await this.prisma.pets.findUnique({
      where: {
        id: petId,
      },
      select: {
        primaryTutorId: true,
      },
    });

    if (!pet) {
      return false;
    }

    if (pet.primaryTutorId === userId) {
      return true;
    }

    const relation = await this.prisma.careRelations.findFirst({
      where: {
        petId,
        userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    return Boolean(relation);
  }

  async findPetById(petId: string) {
    return this.prisma.pets.findUnique({
      where: {
        id: petId,
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        birthDate: true,
        primaryTutorId: true,
      },
    });
  }

  async listVaccinations(petId: string, from?: Date, to?: Date) {
    return this.prisma.vaccinations.findMany({
      where: {
        petId,
        ...(from || to
          ? {
              appliedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });
  }

  async listSanitaryRecords(petId: string, from?: Date, to?: Date) {
    return this.prisma.sanitaryRecords.findMany({
      where: {
        petId,
        ...(from || to
          ? {
              appliedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });
  }
}
