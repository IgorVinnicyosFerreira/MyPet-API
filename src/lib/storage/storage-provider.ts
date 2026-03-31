export type SaveFileInput = {
  domain: 'EXAM' | 'VACCINATION';
  petId: string;
  fileName: string;
  mimeType: string;
  content: Buffer;
};

export type StoredFileResult = {
  relativePath: string;
  sizeBytes: number;
  mimeType: string;
};

export interface StorageProvider {
  save(input: SaveFileInput): Promise<StoredFileResult>;
  remove(relativePath: string): Promise<void>;
}
