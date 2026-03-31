import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FilesService } from './files.service';
import type { UploadFileInput } from './files.types';

export class FilesController {
  constructor(private readonly service: FilesService) {}

  async upload(req: FastifyRequest, reply: FastifyReply) {
    const result = await this.service.upload(req.user.sub, req.body as UploadFileInput);

    return reply.status(201).send(result);
  }
}
