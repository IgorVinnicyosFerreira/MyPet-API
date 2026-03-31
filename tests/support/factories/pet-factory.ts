import { prisma } from '@/lib/prisma';

export async function createPet(input: {
  primaryTutorId: string;
  name?: string;
  species?: string;
  breed?: string;
}) {
  return prisma.pets.create({
    data: {
      primaryTutorId: input.primaryTutorId,
      name: input.name || 'Luna',
      species: input.species || 'Canine',
      breed: input.breed || 'SRD',
    },
  });
}
