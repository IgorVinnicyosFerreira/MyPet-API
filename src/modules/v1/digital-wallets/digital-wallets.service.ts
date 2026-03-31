import { HttpError } from '@/lib/http/error-handler';
import type { DigitalWalletQuery } from './digital-wallets.types';
import type { IDigitalWalletsRepository } from './repositories/digital-wallets-interfaces.repository';

export class DigitalWalletsService {
  constructor(private readonly repository: IDigitalWalletsRepository) {}

  async generate(userId: string, petId: string, query: DigitalWalletQuery) {
    const pet = await this.repository.findPetById(petId);

    if (!pet) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Pet not found');
    }

    const hasAccess = await this.repository.resolveUserAccess(petId, userId);

    if (!hasAccess) {
      throw new HttpError(403, 'FORBIDDEN', 'User has no access to this pet');
    }

    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;

    return {
      pet,
      generatedAt: new Date(),
      vaccinations: await this.repository.listVaccinations(petId, from, to),
      sanitaryRecords: await this.repository.listSanitaryRecords(petId, from, to),
    };
  }
}
