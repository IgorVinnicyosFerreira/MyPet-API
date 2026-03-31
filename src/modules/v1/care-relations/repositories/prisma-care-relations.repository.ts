import type { PrismaClient } from '@/lib/prisma';
import type { ICareRelationsRepository } from './care-relations-interfaces.repository';

export class PrismaCareRelationsRepository implements ICareRelationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPetById(petId: string) {
    return this.prisma.pets.findUnique({
      where: {
        id: petId,
      },
      select: {
        id: true,
        primaryTutorId: true,
      },
    });
  }

  async findRelation(petId: string, userId: string) {
    return this.prisma.careRelations.findFirst({
      where: {
        petId,
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async createRelation(input: {
    petId: string;
    userId: string;
    role: 'CO_TUTOR' | 'CAREGIVER';
    invitedByUserId: string;
  }) {
    return this.prisma.careRelations.create({
      data: {
        petId: input.petId,
        userId: input.userId,
        role: input.role,
        status: 'ACTIVE',
        invitedByUserId: input.invitedByUserId,
      },
    });
  }

  async reactivateRelation(relationId: string, role: 'CO_TUTOR' | 'CAREGIVER') {
    return this.prisma.careRelations.update({
      where: {
        id: relationId,
      },
      data: {
        role,
        status: 'ACTIVE',
        revokedAt: null,
      },
    });
  }
}
