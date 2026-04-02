import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import type {
  IUsersRepository,
  UserEmailLookup,
} from '@/modules/v1/users/repositories/users-interfaces.repository';
import { UsersService } from '@/modules/v1/users/users.service';

function makeUserProfile(
  overrides?: Partial<{
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }>,
) {
  return {
    id: 'user-1',
    name: 'User Test',
    email: 'user@example.com',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeUserEmailLookup(overrides?: Partial<UserEmailLookup>): UserEmailLookup {
  return {
    id: 'user-1',
    email: 'user@example.com',
    ...overrides,
  };
}

function makeUsersRepositoryMock(
  overrides?: Partial<IUsersRepository>,
): IUsersRepository {
  return {
    find: async () => [],
    findProfileById: async () => makeUserProfile(),
    findByEmail: async () => null,
    updateById: async () => makeUserProfile(),
    deleteById: async () => true,
    ...overrides,
  };
}

describe('UsersService', () => {
  it('allows listing users only for SUPER_ADMIN', async () => {
    const service = new UsersService(
      makeUsersRepositoryMock({
        find: async () => [makeUserProfile()],
      }),
    );

    const result = await service.list({}, 'SUPER_ADMIN');

    expect(result).toHaveLength(1);
  });

  it('blocks listing users for non-admin actors', async () => {
    const service = new UsersService(makeUsersRepositoryMock());

    await expect(service.list({}, 'USER')).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('allows update when actor is the same target user', async () => {
    const service = new UsersService(
      makeUsersRepositoryMock({
        updateById: async ({ data }) =>
          makeUserProfile({
            name: data.name || 'Updated Name',
          }),
      }),
    );

    const result = await service.updateById({
      targetUserId: 'user-1',
      actor: {
        actorUserId: 'user-1',
        actorEmail: 'user@example.com',
        actorRole: 'USER',
      },
      payload: {
        name: 'Updated Name',
      },
    });

    expect(result.name).toBe('Updated Name');
  });

  it('allows update when actor is SUPER_ADMIN', async () => {
    const service = new UsersService(makeUsersRepositoryMock());

    const result = await service.updateById({
      targetUserId: 'target-user',
      actor: {
        actorUserId: 'admin-user',
        actorEmail: 'admin@example.com',
        actorRole: 'SUPER_ADMIN',
      },
      payload: {
        name: 'Admin Updated',
      },
    });

    expect(result.id).toBeString();
  });

  it('rejects update when actor is not self and not super admin', async () => {
    const service = new UsersService(makeUsersRepositoryMock());

    await expect(
      service.updateById({
        targetUserId: 'target-user',
        actor: {
          actorUserId: 'another-user',
          actorEmail: 'another@example.com',
          actorRole: 'USER',
        },
        payload: {
          name: 'Invalid Update',
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('rejects update when no whitelisted field is provided', async () => {
    const service = new UsersService(makeUsersRepositoryMock());

    await expect(
      service.updateById({
        targetUserId: 'target-user',
        actor: {
          actorUserId: 'target-user',
          actorEmail: 'target@example.com',
        },
        payload: {
          unsupportedField: 'x',
        } as never,
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('returns 409 when update email already belongs to another user', async () => {
    const service = new UsersService(
      makeUsersRepositoryMock({
        findByEmail: async (email) =>
          makeUserEmailLookup({
            id: 'different-user',
            email,
          }),
      }),
    );

    await expect(
      service.updateById({
        targetUserId: 'target-user',
        actor: {
          actorUserId: 'target-user',
          actorEmail: 'target@example.com',
          actorRole: 'USER',
        },
        payload: {
          email: 'already-used@example.com',
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('maps get-by-id missing user to 404', async () => {
    const service = new UsersService(
      makeUsersRepositoryMock({
        findProfileById: async () => null,
      }),
    );

    await expect(service.getById('missing-user')).rejects.toMatchObject({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  it('sanitizes get-by-id response by excluding sensitive fields', async () => {
    const service = new UsersService(makeUsersRepositoryMock());

    const result = await service.getById('user-1');

    expect(result).toMatchObject({
      id: 'user-1',
      name: 'User Test',
      email: 'user@example.com',
    });
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('blocks delete for non-super-admin actor', async () => {
    const service = new UsersService(makeUsersRepositoryMock());

    await expect(
      service.deleteById({
        targetUserId: 'target-user',
        actor: {
          actorUserId: 'actor-user',
          actorEmail: 'actor@example.com',
          actorRole: 'USER',
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('returns 404 when super admin deletes a missing user', async () => {
    const service = new UsersService(
      makeUsersRepositoryMock({
        deleteById: async () => false,
      }),
    );

    await expect(
      service.deleteById({
        targetUserId: 'missing-user',
        actor: {
          actorUserId: 'admin-user',
          actorEmail: 'admin@example.com',
          actorRole: 'SUPER_ADMIN',
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    });
  });
});
