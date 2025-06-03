import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { UserEntity } from './user.entity';

@Injectable()
export class UsersRepository extends Repository<UserEntity> {
  constructor(dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  async findOneById(id: string): Promise<UserEntity | null> {
    return this.findOne({
      where: { id },
    });
  }

  async findOneByEvmAddress(address: string): Promise<UserEntity | null> {
    return this.findOne({
      where: { evmAddress: address },
    });
  }
}
