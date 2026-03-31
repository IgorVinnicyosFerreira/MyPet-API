import { randomUUID } from 'node:crypto';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';

export async function createUser(overrides?: {
  name?: string;
  email?: string;
  password?: string;
}) {
  const password = overrides?.password || 'password123';

  const user = await prisma.users.create({
    data: {
      name: overrides?.name || 'Factory User',
      email: overrides?.email || `factory-${randomUUID()}@example.com`,
      passwordHash: await hashPassword(password),
    },
  });

  return {
    ...user,
    password,
  };
}
