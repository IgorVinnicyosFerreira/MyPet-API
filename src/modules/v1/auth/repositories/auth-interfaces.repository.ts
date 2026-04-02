export type AuthRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthContextRecord = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
};

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthRecord | null>;
  findAuthContextById(userId: string): Promise<AuthContextRecord | null>;
  create(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<AuthRecord>;
  deleteById(userId: string): Promise<void>;
}
