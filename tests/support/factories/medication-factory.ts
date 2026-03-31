import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export async function createMedication(overrides?: {
  name?: string;
  description?: string;
  catalogScope?: 'GLOBAL' | 'TUTOR';
  ownerUserId?: string;
}) {
  return prisma.medications.create({
    data: {
      name: overrides?.name || `Medication ${randomUUID().slice(0, 8)}`,
      description: overrides?.description,
      catalogScope: overrides?.catalogScope || 'GLOBAL',
      ownerUserId:
        overrides?.catalogScope === 'TUTOR' ? overrides.ownerUserId || null : null,
    },
  });
}
