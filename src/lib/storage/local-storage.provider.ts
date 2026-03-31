import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SaveFileInput, StorageProvider } from './storage-provider';

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly rootDir: string) {}

  async save(input: SaveFileInput) {
    const folder = input.domain === 'EXAM' ? 'exams' : 'vaccinations';
    const relativePath = `pets/${input.petId}/${folder}/${input.fileName}`;
    const absolutePath = join(this.rootDir, relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.content);

    return {
      relativePath,
      sizeBytes: input.content.byteLength,
      mimeType: input.mimeType,
    };
  }

  async remove(relativePath: string) {
    await rm(join(this.rootDir, relativePath), { force: true });
  }
}
