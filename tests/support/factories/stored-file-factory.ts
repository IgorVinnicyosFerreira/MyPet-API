import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export async function createStoredFile(input: {
  petId: string;
  uploadedByUserId: string;
  domain?: 'EXAM' | 'VACCINATION';
  originalName?: string;
}) {
  const extension = input.domain === 'VACCINATION' ? 'png' : 'pdf';

  return prisma.storedFiles.create({
    data: {
      petId: input.petId,
      uploadedByUserId: input.uploadedByUserId,
      domain: input.domain || 'EXAM',
      provider: 'LOCAL',
      relativePath: `pets/${input.petId}/tests/${randomUUID()}.${extension}`,
      originalName: input.originalName || `file-${randomUUID()}.${extension}`,
      mimeType: input.domain === 'VACCINATION' ? 'image/png' : 'application/pdf',
      sizeBytes: 128,
    },
  });
}
