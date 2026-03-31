import type { PrismaClient } from '@/lib/prisma';
import type { IFilesRepository } from './files-interfaces.repository';

export class PrismaFilesRepository implements IFilesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createStoredFile(input: {
    petId: string;
    domain: 'EXAM' | 'VACCINATION';
    relativePath: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedByUserId: string;
  }) {
    return this.prisma.storedFiles.create({
      data: {
        petId: input.petId,
        domain: input.domain,
        provider: 'LOCAL',
        relativePath: input.relativePath,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        uploadedByUserId: input.uploadedByUserId,
      },
    });
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.storedFiles.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
