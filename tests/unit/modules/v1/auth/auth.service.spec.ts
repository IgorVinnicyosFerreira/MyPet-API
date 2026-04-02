import '../../../../setup/unit.setup';
import { describe, expect, it } from 'bun:test';
import { AuthService } from '@/modules/v1/auth/auth.service';
import type {
  AuthRecord,
  IAuthRepository,
} from '@/modules/v1/auth/repositories/auth-interfaces.repository';

function makeAuthRecord(overrides?: Partial<AuthRecord>): AuthRecord {
  return {
    id: 'user-1',
    name: 'User Test',
    email: 'user@example.com',
    passwordHash: 'salt:hash',
    isSuperAdmin: false,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeAuthRepositoryMock(overrides?: Partial<IAuthRepository>): IAuthRepository {
  return {
    findByEmail: async () => null,
    findAuthContextById: async () => null,
    create: async (input) =>
      makeAuthRecord({
        name: input.name,
        email: input.email,
      }),
    deleteById: async () => undefined,
    ...overrides,
  };
}

describe('AuthService', () => {
  it('issues token during register and returns legacy user fields', async () => {
    const createInputs: Array<{ name: string; email: string; passwordHash: string }> =
      [];

    const service = new AuthService(
      makeAuthRepositoryMock({
        create: async (input) => {
          createInputs.push(input);
          return makeAuthRecord({
            id: 'user-created',
            name: input.name,
            email: input.email,
          });
        },
      }),
      {
        signToken: () => 'token-123',
      },
    );

    const result = await service.register({
      name: 'New User',
      email: 'new-user@example.com',
      password: 'password123',
    });

    expect(result).toMatchObject({
      id: 'user-created',
      name: 'New User',
      email: 'new-user@example.com',
      token: 'token-123',
      expiresIn: 3600,
    });

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(createInputs).toHaveLength(1);
    expect(createInputs[0]?.passwordHash).toContain(':');
    expect(createInputs[0]?.passwordHash).not.toBe('password123');
  });

  it('returns 409 when trying to register with an existing email', async () => {
    const service = new AuthService(
      makeAuthRepositoryMock({
        findByEmail: async () => makeAuthRecord(),
      }),
    );

    await expect(
      service.register({
        name: 'Duplicated',
        email: 'user@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('rolls back created user when token issuance fails', async () => {
    const deletedUserIds: string[] = [];

    const service = new AuthService(
      makeAuthRepositoryMock({
        create: async () =>
          makeAuthRecord({
            id: 'user-to-rollback',
            email: 'rollback@example.com',
          }),
        deleteById: async (userId) => {
          deletedUserIds.push(userId);
        },
      }),
      {
        signToken: () => {
          throw new Error('token failed');
        },
      },
    );

    await expect(
      service.register({
        name: 'Rollback User',
        email: 'rollback@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(deletedUserIds).toEqual(['user-to-rollback']);
  });
});
