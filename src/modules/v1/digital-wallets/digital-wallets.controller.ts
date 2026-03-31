import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DigitalWalletsService } from './digital-wallets.service';
import type { DigitalWalletQuery } from './digital-wallets.types';

export class DigitalWalletsController {
  constructor(private readonly service: DigitalWalletsService) {}

  async generate(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { petId: string };
    const wallet = await this.service.generate(
      req.user.sub,
      params.petId,
      req.query as DigitalWalletQuery,
    );

    return reply.status(200).send(wallet);
  }
}
