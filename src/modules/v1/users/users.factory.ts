import { prisma } from '@/lib/prisma';
import { PrismaUsersRepository } from './repositories/prisma-users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

let instance: UsersController;

function makeUsersController(): UsersController {
  if (!instance) {
    const usersRepository = new PrismaUsersRepository(prisma);
    const usersService = new UsersService(usersRepository);
    instance = new UsersController(usersService);
  }

  return instance;
}

export { makeUsersController };
