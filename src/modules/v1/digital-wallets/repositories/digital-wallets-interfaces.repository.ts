export interface IDigitalWalletsRepository {
  resolveUserAccess(petId: string, userId: string): Promise<boolean>;
  findPetById(petId: string): Promise<{
    id: string;
    name: string;
    species: string;
    breed: string | null;
    birthDate: Date | null;
    primaryTutorId: string;
  } | null>;
  listVaccinations(
    petId: string,
    from?: Date,
    to?: Date,
  ): Promise<Array<Record<string, unknown>>>;
  listSanitaryRecords(
    petId: string,
    from?: Date,
    to?: Date,
  ): Promise<Array<Record<string, unknown>>>;
}
