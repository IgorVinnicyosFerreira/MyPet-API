import { prisma } from '@/lib/prisma';
import { PrismaFilesRepository } from '../files/repositories/prisma-files.repository';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { PrismaPetsRepository } from './repositories/prisma-pets.repository';

let instance: PetsController;

function makePetsController(): PetsController {
  if (!instance) {
    const petsRepository = new PrismaPetsRepository(prisma);
    const filesRepository = new PrismaFilesRepository(prisma);
    const service = new PetsService(petsRepository, filesRepository);
    instance = new PetsController(service);
  }

  return instance;
}

export { makePetsController };
