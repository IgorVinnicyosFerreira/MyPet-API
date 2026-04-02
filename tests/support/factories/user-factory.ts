import { randomUUID } from 'node:crypto';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';

export type UserFixtureRole = 'USER' | 'SUPER_ADMIN';

const fixtureByRole: Record<UserFixtureRole, { name: string; email: string }> = {
  USER: {
    name: 'Fixture User',
    email: 'fixture-user@example.com',
  },
  SUPER_ADMIN: {
    name: 'Fixture Super Admin',
    email: 'fixture-super-admin@example.com',
  },
};

export async function createUser(overrides?: {
  name?: string;
  email?: string;
  password?: string;
  isSuperAdmin?: boolean;
}) {
  const password = overrides?.password || 'password123';

  const user = await prisma.users.create({
    data: {
      name: overrides?.name || 'Factory User',
      email: overrides?.email || `factory-${randomUUID()}@example.com`,
      passwordHash: await hashPassword(password),
      isSuperAdmin: overrides?.isSuperAdmin ?? false,
    },
  });

  return {
    ...user,
    password,
  };
}

export async function createUserFixture(
  role: UserFixtureRole,
  overrides?: {
    name?: string;
    email?: string;
    password?: string;
  },
) {
  const defaults = fixtureByRole[role];
  const password = overrides?.password || 'password123';
  const email = overrides?.email || defaults.email;
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const existingUser = await prisma.users.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    const user =
      existingUser.isSuperAdmin === isSuperAdmin
        ? existingUser
        : await prisma.users.update({
            where: { id: existingUser.id },
            data: { isSuperAdmin },
          });

    return {
      ...user,
      password,
      role,
    };
  }

  const user = await prisma.users.create({
    data: {
      name: overrides?.name || defaults.name,
      email,
      passwordHash: await hashPassword(password),
      isSuperAdmin,
    },
  });

  return {
    ...user,
    password,
    role,
  };
}
