import { signJwt } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { HttpError } from '@/lib/http/error-handler';
import type {
  AuthLoginInput,
  AuthRegisterInput,
  AuthTokenResponse,
  AuthUser,
} from './auth.types';
import type { IAuthRepository } from './repositories/auth-interfaces.repository';

export class AuthService {
  constructor(private readonly repository: IAuthRepository) {}

  private mapAuthUser(user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(input: AuthRegisterInput): Promise<AuthUser> {
    const existingUser = await this.repository.findByEmail(input.email);

    if (existingUser) {
      throw new HttpError(409, 'CONFLICT', 'Email already registered');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.repository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return this.mapAuthUser(user);
  }

  async login(input: AuthLoginInput): Promise<AuthTokenResponse> {
    const user = await this.repository.findByEmail(input.email);

    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    const expiresIn = 60 * 60;
    const authUser = this.mapAuthUser(user);

    return {
      token: signJwt(
        {
          sub: user.id,
          email: user.email,
        },
        expiresIn,
      ),
      expiresIn,
      user: authUser,
    };
  }
}
