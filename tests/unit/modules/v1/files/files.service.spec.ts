import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { FilesService } from '@/modules/v1/files/files.service';
import type { IFilesRepository } from '@/modules/v1/files/repositories/files-interfaces.repository';
import { resetStorage } from '../../../../support/storage';

function makeRepositoryMock(overrides?: Partial<IFilesRepository>): IFilesRepository {
  return {
    createStoredFile: async (input) => ({
      id: 'file-1',
      petId: input.petId,
      domain: input.domain,
      provider: 'LOCAL',
      relativePath: input.relativePath,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      checksum: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findByIds: async () => [],
    ...overrides,
  };
}

describe('FilesService', () => {
  it('rejects unsupported mime types', async () => {
    const service = new FilesService(makeRepositoryMock());

    await expect(
      service.upload('user-1', {
        petId: 'pet-1',
        domain: 'EXAM',
        originalName: 'script.sh',
        mimeType: 'text/plain' as never,
        contentBase64: Buffer.from('echo test').toString('base64'),
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('rejects invalid base64 content', async () => {
    const service = new FilesService(makeRepositoryMock());

    await expect(
      service.upload('user-1', {
        petId: 'pet-1',
        domain: 'EXAM',
        originalName: 'exam.pdf',
        mimeType: 'application/pdf',
        contentBase64: '%%%%',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('rejects files bigger than 10MB', async () => {
    const service = new FilesService(makeRepositoryMock());

    const contentBase64 = Buffer.alloc(10 * 1024 * 1024 + 1, 1).toString('base64');

    await expect(
      service.upload('user-1', {
        petId: 'pet-1',
        domain: 'EXAM',
        originalName: 'exam.pdf',
        mimeType: 'application/pdf',
        contentBase64,
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('stores file metadata and checksum for valid uploads', async () => {
    process.env.STORAGE_ROOT = `/tmp/mypet-unit-storage-${randomUUID()}`;
    await resetStorage();

    let persistedPath = '';

    const service = new FilesService(
      makeRepositoryMock({
        createStoredFile: async (input) => {
          persistedPath = input.relativePath;
          return {
            id: 'file-1',
            petId: input.petId,
            domain: input.domain,
            provider: 'LOCAL',
            relativePath: input.relativePath,
            originalName: input.originalName,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            checksum: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      }),
    );

    const result = await service.upload('user-1', {
      petId: 'pet-1',
      domain: 'EXAM',
      originalName: 'hemograma.pdf',
      mimeType: 'application/pdf',
      contentBase64: Buffer.from('pdf-content').toString('base64'),
    });

    expect(persistedPath).toContain('pets/pet-1/exams/');
    expect(result.checksum).toBeString();
    expect(result.provider).toBe('LOCAL');
  });
});
