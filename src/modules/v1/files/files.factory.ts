import { prisma } from '@/lib/prisma';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaFilesRepository } from './repositories/prisma-files.repository';

let instance: FilesController;

function makeFilesController(): FilesController {
  if (!instance) {
    const repository = new PrismaFilesRepository(prisma);
    const service = new FilesService(repository);
    instance = new FilesController(service);
  }

  return instance;
}

export { makeFilesController };
