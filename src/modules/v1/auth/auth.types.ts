export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthRegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthLoginInput = {
  email: string;
  password: string;
};

export type AuthTokenResponse = {
  token: string;
  expiresIn: number;
  user: AuthUser;
};
