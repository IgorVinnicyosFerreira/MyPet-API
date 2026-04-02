import type { PrismaClient } from '@/lib/prisma';
import type { IUsersRepository } from './users-interfaces.repository';

export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(params: { name?: string }) {
    return this.prisma.users.findMany({
      where: {
        name: params.name
          ? {
              contains: params.name,
              mode: 'insensitive',
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findProfileById(userId: string) {
    return this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async updateById(input: { userId: string; data: { name?: string; email?: string } }) {
    const data: { name?: string; email?: string } = {};

    if (typeof input.data.name !== 'undefined') {
      data.name = input.data.name;
    }

    if (typeof input.data.email !== 'undefined') {
      data.email = input.data.email;
    }

    try {
      await this.prisma.users.update({
        where: {
          id: input.userId,
        },
        data,
      });

      return this.findProfileById(input.userId);
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        return null;
      }

      throw error;
    }
  }

  async deleteById(userId: string) {
    try {
      await this.prisma.users.delete({
        where: {
          id: userId,
        },
      });

      return true;
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        return false;
      }

      throw error;
    }
  }

  private isRecordNotFound(error: unknown) {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeError = error as { code?: string };

    return maybeError.code === 'P2025';
  }
}
