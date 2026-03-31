export type FileDomain = 'EXAM' | 'VACCINATION';

export type UploadFileInput = {
  petId: string;
  domain: FileDomain;
  originalName: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  contentBase64: string;
};

export type StoredFileOutput = {
  id: string;
  petId: string;
  domain: FileDomain;
  provider: 'LOCAL';
  relativePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  createdAt: Date;
  updatedAt: Date;
};
