import type { FileDomain, StoredFileOutput } from '../files.types';

export interface IFilesRepository {
  createStoredFile(input: {
    petId: string;
    domain: FileDomain;
    relativePath: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedByUserId: string;
  }): Promise<StoredFileOutput>;

  findByIds(ids: string[]): Promise<StoredFileOutput[]>;
}
