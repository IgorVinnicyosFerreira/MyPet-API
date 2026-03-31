import { prisma } from '@/lib/prisma';
import { CareRelationsController } from './care-relations.controller';
import { CareRelationsService } from './care-relations.service';
import { PrismaCareRelationsRepository } from './repositories/prisma-care-relations.repository';

let instance: CareRelationsController;

function makeCareRelationsController(): CareRelationsController {
  if (!instance) {
    const repository = new PrismaCareRelationsRepository(prisma);
    const service = new CareRelationsService(repository);
    instance = new CareRelationsController(service);
  }

  return instance;
}

export { makeCareRelationsController };
