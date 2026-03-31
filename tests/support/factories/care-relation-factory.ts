import { prisma } from '@/lib/prisma';

export async function createCareRelation(input: {
  petId: string;
  userId: string;
  invitedByUserId: string;
  role?: 'CO_TUTOR' | 'CAREGIVER';
  status?: 'PENDING' | 'ACTIVE' | 'REVOKED';
}) {
  return prisma.careRelations.create({
    data: {
      petId: input.petId,
      userId: input.userId,
      invitedByUserId: input.invitedByUserId,
      role: input.role || 'CO_TUTOR',
      status: input.status || 'ACTIVE',
    },
  });
}
