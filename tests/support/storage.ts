import { mkdir, rm } from 'node:fs/promises';

export async function resetStorage() {
  const root = process.env.STORAGE_ROOT || '/tmp/mypet-test-storage';

  await rm(root, { force: true, recursive: true });
  await mkdir(root, { recursive: true });
}
