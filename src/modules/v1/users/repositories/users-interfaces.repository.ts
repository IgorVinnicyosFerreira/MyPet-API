import type { UserListQuery, UserProfile, UserUpdatePayload } from '../users.types';

export type UserEmailLookup = {
  id: string;
  email: string;
};

export interface IUsersRepository {
  find(params: UserListQuery): Promise<UserProfile[]>;
  findProfileById(userId: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserEmailLookup | null>;
  updateById(input: {
    userId: string;
    data: UserUpdatePayload;
  }): Promise<UserProfile | null>;
  deleteById(userId: string): Promise<boolean>;
}
