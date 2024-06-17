import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '../../database/base.repository';
import { UserEntity } from '../../database/entities';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.findOne({
      where: { id },
      relations: { campaigns: true, exchangeAPIKeys: true },
    });
  }

  public async findOneByEvmAddress(
    evmAddress: string,
  ): Promise<UserEntity | null> {
    return this.findOne({
      where: { evmAddress },
      relations: { campaigns: true, exchangeAPIKeys: true },
    });
  }
}
