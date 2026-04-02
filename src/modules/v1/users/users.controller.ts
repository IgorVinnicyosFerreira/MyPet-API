import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UsersService } from './users.service';
import type { UserUpdatePayload } from './users.types';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async list(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as { name?: string };
    const users = await this.usersService.list(query, req.user.role);

    return reply.status(200).send(users);
  }

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { userId: string };
    const user = await this.usersService.getById(params.userId);

    return reply.status(200).send(user);
  }

  async updateById(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { userId: string };
    const body = req.body as UserUpdatePayload;
    const updatedUser = await this.usersService.updateById({
      targetUserId: params.userId,
      payload: body,
      actor: {
        actorUserId: req.user.sub,
        actorEmail: req.user.email,
        actorRole: req.user.role,
      },
    });

    return reply.status(200).send(updatedUser);
  }

  async deleteById(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { userId: string };

    await this.usersService.deleteById({
      targetUserId: params.userId,
      actor: {
        actorUserId: req.user.sub,
        actorEmail: req.user.email,
        actorRole: req.user.role,
      },
    });

    return reply.status(204).send();
  }
}
