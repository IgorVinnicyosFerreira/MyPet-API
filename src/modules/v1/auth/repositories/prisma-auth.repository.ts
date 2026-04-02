import type { PrismaClient } from '@/lib/prisma';
import type { IAuthRepository } from './auth-interfaces.repository';

export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  async findAuthContextById(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
      },
    });
  }

  async create(input: { name: string; email: string; passwordHash: string }) {
    return this.prisma.users.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      },
    });
  }

  async deleteById(userId: string) {
    await this.prisma.users.deleteMany({
      where: {
        id: userId,
      },
    });
  }
}
