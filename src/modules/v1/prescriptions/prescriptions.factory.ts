import { prisma } from '@/lib/prisma';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaPrescriptionsRepository } from './repositories/prisma-prescriptions.repository';

let instance: PrescriptionsController;

function makePrescriptionsController(): PrescriptionsController {
  if (!instance) {
    const repository = new PrismaPrescriptionsRepository(prisma);
    const service = new PrescriptionsService(repository);
    instance = new PrescriptionsController(service);
  }

  return instance;
}

export { makePrescriptionsController };
