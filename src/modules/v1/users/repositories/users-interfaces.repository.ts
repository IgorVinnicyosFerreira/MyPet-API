import type { User } from '../users.types';

export interface IUsersRepository {
  find(params: { name?: string }): Promise<User[]>;
}
