import { LocalStorageProvider } from './local-storage.provider';
import type { StorageProvider } from './storage-provider';

let storageProvider: StorageProvider | null = null;

export function makeStorageProvider() {
  if (!storageProvider) {
    storageProvider = new LocalStorageProvider(process.env.STORAGE_ROOT || 'storage');
  }

  return storageProvider;
}
