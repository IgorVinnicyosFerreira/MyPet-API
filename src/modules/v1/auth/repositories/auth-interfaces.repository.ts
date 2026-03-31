export type AuthRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthRecord | null>;
  create(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<AuthRecord>;
}
