import { prisma } from '@/lib/prisma';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaAuthRepository } from './repositories/prisma-auth.repository';

let instance: AuthController;

function makeAuthController(): AuthController {
  if (!instance) {
    const repository = new PrismaAuthRepository(prisma);
    const service = new AuthService(repository);
    instance = new AuthController(service);
  }

  return instance;
}

export { makeAuthController };
