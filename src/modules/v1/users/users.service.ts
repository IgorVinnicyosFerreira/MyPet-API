import { HttpError } from '@/lib/http/error-handler';
import type { IUsersRepository } from './repositories/users-interfaces.repository';
import type {
  UserDeleteCommand,
  UserListQuery,
  UserProfile,
  UserUpdateCommand,
  UserUpdatePayload,
} from './users.types';

export class UsersService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async list(query: UserListQuery = {}, actorRole?: string) {
    if (actorRole !== 'SUPER_ADMIN') {
      throw new HttpError(403, 'FORBIDDEN', 'Insufficient permission');
    }

    return this.usersRepository.find(query);
  }

  async getById(userId: string): Promise<UserProfile> {
    const user = await this.usersRepository.findProfileById(userId);

    if (!user) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'User not found');
    }

    return user;
  }

  async updateById(command: UserUpdateCommand): Promise<UserProfile> {
    this.ensureCanUpdate(command.actor, command.targetUserId);
    const payload = this.buildAllowedUpdatePayload(command.payload);

    if (payload.email) {
      const existingEmailOwner = await this.usersRepository.findByEmail(payload.email);

      if (existingEmailOwner && existingEmailOwner.id !== command.targetUserId) {
        throw new HttpError(409, 'CONFLICT', 'Email already registered');
      }
    }

    try {
      const updatedUser = await this.usersRepository.updateById({
        userId: command.targetUserId,
        data: payload,
      });

      if (!updatedUser) {
        throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'User not found');
      }

      return updatedUser;
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new HttpError(409, 'CONFLICT', 'Email already registered');
      }

      throw error;
    }
  }

  async deleteById(command: UserDeleteCommand): Promise<void> {
    if (command.actor.actorRole !== 'SUPER_ADMIN') {
      throw new HttpError(403, 'FORBIDDEN', 'Insufficient permission');
    }

    const deleted = await this.usersRepository.deleteById(command.targetUserId);

    if (!deleted) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'User not found');
    }
  }

  private ensureCanUpdate(
    actor: {
      actorUserId: string;
      actorRole?: string;
    },
    targetUserId: string,
  ) {
    const isSelf = actor.actorUserId === targetUserId;
    const isSuperAdmin = actor.actorRole === 'SUPER_ADMIN';

    if (!isSelf && !isSuperAdmin) {
      throw new HttpError(403, 'FORBIDDEN', 'Insufficient permission');
    }
  }

  private buildAllowedUpdatePayload(payload: UserUpdatePayload): UserUpdatePayload {
    const data: UserUpdatePayload = {};

    if (typeof payload.name !== 'undefined') {
      data.name = payload.name;
    }

    if (typeof payload.email !== 'undefined') {
      data.email = payload.email;
    }

    if (!Object.keys(data).length) {
      throw new HttpError(
        422,
        'UNPROCESSABLE_ENTITY',
        'At least one field is required',
      );
    }

    return data;
  }

  private isUniqueConflict(error: unknown) {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeError = error as { code?: string };

    return maybeError.code === 'P2002';
  }
}
