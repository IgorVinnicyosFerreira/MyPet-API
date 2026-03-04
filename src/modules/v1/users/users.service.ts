import type { IUsersRepository } from './repositories/users-interfaces.repository';

export class UsersService {
  constructor(private usersRepository: IUsersRepository) {}

  async list() {
    return this.usersRepository.find({});
  }
}
