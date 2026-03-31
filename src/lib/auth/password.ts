import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');

  return `${salt}:${derivedKey}`;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const [salt, expectedHash] = hashedPassword.split(':');

  if (!salt || !expectedHash) {
    return false;
  }

  const currentHash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');

  return timingSafeEqual(Buffer.from(currentHash), Buffer.from(expectedHash));
}
