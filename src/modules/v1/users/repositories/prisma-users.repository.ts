import type { PrismaClient } from '@/lib/prisma';
import type { IUsersRepository } from './users-interfaces.repository';

export class PrismaUsersRepository implements IUsersRepository {
  constructor(private prisma: PrismaClient) {}

  async find() {
    return this.prisma.users.findMany();
  }
}
