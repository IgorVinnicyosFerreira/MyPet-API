import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UsersService } from './users.service';

export class UsersController {
  constructor(private usersService: UsersService) {}

  async list(req: FastifyRequest, reply: FastifyReply) {
    const users = await this.usersService.list();

    return reply.status(200).send(users);
  }
}
