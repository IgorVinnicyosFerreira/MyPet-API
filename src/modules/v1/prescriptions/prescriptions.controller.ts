import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PrescriptionsService } from './prescriptions.service';
import type {
  DoseRecordInput,
  PrescriptionInput,
  PrescriptionUpdateInput,
} from './prescriptions.types';

export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    const prescription = await this.service.create(
      req.user.sub,
      req.body as PrescriptionInput,
    );

    return reply.status(201).send(prescription);
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { prescriptionId: string };
    const prescription = await this.service.update(
      req.user.sub,
      params.prescriptionId,
      req.body as PrescriptionUpdateInput,
    );

    return reply.status(200).send(prescription);
  }

  async createDoseRecord(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { prescriptionId: string };
    const doseRecord = await this.service.createDoseRecord(
      req.user.sub,
      params.prescriptionId,
      req.body as DoseRecordInput,
    );

    return reply.status(201).send(doseRecord);
  }

  async listAgenda(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const query = req.query as { date: string };
    const agenda = await this.service.listAgenda(
      req.user.sub,
      params.petId,
      query.date,
    );

    return reply.status(200).send(agenda);
  }
}
