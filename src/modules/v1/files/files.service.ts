import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { HttpError } from '@/lib/http/error-handler';
import { makeStorageProvider } from '@/lib/storage/storage.factory';
import { MAX_FILE_SIZE_BYTES } from './files.constants';
import type { StoredFileOutput, UploadFileInput } from './files.types';
import type { IFilesRepository } from './repositories/files-interfaces.repository';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export class FilesService {
  constructor(private readonly repository: IFilesRepository) {}

  async upload(userId: string, input: UploadFileInput): Promise<StoredFileOutput> {
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new HttpError(422, 'UNPROCESSABLE_ENTITY', 'Unsupported file mime type');
    }

    const contentBuffer = Buffer.from(input.contentBase64, 'base64');

    if (contentBuffer.byteLength === 0 || Number.isNaN(contentBuffer.byteLength)) {
      throw new HttpError(400, 'BAD_REQUEST', 'Invalid file content');
    }

    if (contentBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new HttpError(422, 'UNPROCESSABLE_ENTITY', 'File exceeds max size of 10MB');
    }

    const safeExtension =
      extname(input.originalName).replace(/[^.a-zA-Z0-9]/g, '') || '.bin';
    const fileName = `${randomUUID()}${safeExtension}`;

    const storage = makeStorageProvider();
    const persistedFile = await storage.save({
      domain: input.domain,
      petId: input.petId,
      fileName,
      mimeType: input.mimeType,
      content: contentBuffer,
    });

    const checksum = createHash('sha256').update(contentBuffer).digest('hex');

    return this.repository
      .createStoredFile({
        petId: input.petId,
        domain: input.domain,
        relativePath: persistedFile.relativePath,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: persistedFile.sizeBytes,
        uploadedByUserId: userId,
      })
      .then((stored) => ({
        ...stored,
        checksum,
      }));
  }
}
