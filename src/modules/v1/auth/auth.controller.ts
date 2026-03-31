import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthService } from './auth.service';
import type { AuthLoginInput, AuthRegisterInput } from './auth.types';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async register(req: FastifyRequest, reply: FastifyReply) {
    const result = await this.service.register(req.body as AuthRegisterInput);

    return reply.status(201).send(result);
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const result = await this.service.login(req.body as AuthLoginInput);

    return reply.status(200).send(result);
  }
}
