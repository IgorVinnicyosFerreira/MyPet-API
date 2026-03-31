import { HttpError } from '@/lib/http/error-handler';
import type { CareRelationInput } from './care-relations.types';
import type { ICareRelationsRepository } from './repositories/care-relations-interfaces.repository';

export class CareRelationsService {
  constructor(private readonly repository: ICareRelationsRepository) {}

  async create(petId: string, invitedByUserId: string, input: CareRelationInput) {
    const pet = await this.repository.findPetById(petId);

    if (!pet) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Pet not found');
    }

    if (pet.primaryTutorId !== invitedByUserId) {
      throw new HttpError(
        403,
        'FORBIDDEN',
        'Only primary tutor can manage care relations',
      );
    }

    if (input.userId === invitedByUserId) {
      throw new HttpError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Primary tutor cannot invite themselves',
      );
    }

    const existing = await this.repository.findRelation(petId, input.userId);

    if (existing) {
      return this.repository.reactivateRelation(existing.id, input.role);
    }

    return this.repository.createRelation({
      petId,
      userId: input.userId,
      role: input.role,
      invitedByUserId,
    });
  }
}
