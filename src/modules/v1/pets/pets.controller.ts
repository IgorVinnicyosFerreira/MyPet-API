import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PetsService } from './pets.service';
import type {
  ClinicalRecordType,
  ClinicalRecordUpdateInput,
  ConsultationInput,
  ExamInput,
  FeedingRecordInput,
  PetCreateInput,
  SanitaryRecordInput,
  VaccinationInput,
  WeightRecordInput,
} from './pets.types';

export class PetsController {
  constructor(private readonly service: PetsService) {}

  async getPetById(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const pet = await this.service.getPetById(params.petId, req.user.sub);

    return reply.status(200).send(pet);
  }

  async createPet(req: FastifyRequest, reply: FastifyReply) {
    const pet = await this.service.createPet(req.user.sub, req.body as PetCreateInput);

    return reply.status(201).send(pet);
  }

  async listPets(req: FastifyRequest, reply: FastifyReply) {
    const pets = await this.service.listPets(req.user.sub);

    return reply.status(200).send(pets);
  }

  async createFeeding(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const record = await this.service.createFeeding(
      params.petId,
      req.user.sub,
      req.body as FeedingRecordInput,
    );

    return reply.status(201).send(record);
  }

  async createWeight(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const record = await this.service.createWeight(
      params.petId,
      req.user.sub,
      req.body as WeightRecordInput,
    );

    return reply.status(201).send(record);
  }

  async createConsultation(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const record = await this.service.createConsultation(
      params.petId,
      req.user.sub,
      req.body as ConsultationInput,
    );

    return reply.status(201).send(record);
  }

  async createExam(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const record = await this.service.createExam(
      params.petId,
      req.user.sub,
      req.body as ExamInput,
    );

    return reply.status(201).send(record);
  }

  async createVaccination(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const record = await this.service.createVaccination(
      params.petId,
      req.user.sub,
      req.body as VaccinationInput,
    );

    return reply.status(201).send(record);
  }

  async createSanitaryRecord(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const record = await this.service.createSanitaryRecord(
      params.petId,
      req.user.sub,
      req.body as SanitaryRecordInput,
    );

    return reply.status(201).send(record);
  }

  async listHistory(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const history = await this.service.listHistory(params.petId, req.user.sub);

    return reply.status(200).send(history);
  }

  async updateClinicalRecord(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as {
      petId: string;
      recordType: ClinicalRecordType;
      recordId: string;
    };

    const record = await this.service.updateClinicalRecord(
      params.petId,
      req.user.sub,
      params.recordType,
      params.recordId,
      req.body as ClinicalRecordUpdateInput,
    );

    return reply.status(200).send(record);
  }
}
