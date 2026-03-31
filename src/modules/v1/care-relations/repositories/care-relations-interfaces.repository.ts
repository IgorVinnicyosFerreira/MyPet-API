export interface ICareRelationsRepository {
  findPetById(petId: string): Promise<{ id: string; primaryTutorId: string } | null>;
  findRelation(
    petId: string,
    userId: string,
  ): Promise<{
    id: string;
    status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  } | null>;
  createRelation(input: {
    petId: string;
    userId: string;
    role: 'CO_TUTOR' | 'CAREGIVER';
    invitedByUserId: string;
  }): Promise<Record<string, unknown>>;
  reactivateRelation(
    relationId: string,
    role: 'CO_TUTOR' | 'CAREGIVER',
  ): Promise<Record<string, unknown>>;
}
