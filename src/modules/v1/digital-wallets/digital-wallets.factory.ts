import { prisma } from '@/lib/prisma';
import { DigitalWalletsController } from './digital-wallets.controller';
import { DigitalWalletsService } from './digital-wallets.service';
import { PrismaDigitalWalletsRepository } from './repositories/prisma-digital-wallets.repository';

let instance: DigitalWalletsController;

function makeDigitalWalletsController(): DigitalWalletsController {
  if (!instance) {
    const repository = new PrismaDigitalWalletsRepository(prisma);
    const service = new DigitalWalletsService(repository);
    instance = new DigitalWalletsController(service);
  }

  return instance;
}

export { makeDigitalWalletsController };
