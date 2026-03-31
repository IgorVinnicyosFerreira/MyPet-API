import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CareRelationsService } from './care-relations.service';
import type { CareRelationInput } from './care-relations.types';

export class CareRelationsController {
  constructor(private readonly service: CareRelationsService) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const relation = await this.service.create(
      params.petId,
      req.user.sub,
      req.body as CareRelationInput,
    );

    return reply.status(201).send(relation);
  }
}
