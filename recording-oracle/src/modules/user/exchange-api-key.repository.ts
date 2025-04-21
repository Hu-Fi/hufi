import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '../../database/base.repository';
import { ExchangeAPIKeyEntity, UserEntity } from '../../database/entities';

@Injectable()
export class ExchangeAPIKeyRepository extends BaseRepository<ExchangeAPIKeyEntity> {
  constructor(private dataSource: DataSource) {
    super(ExchangeAPIKeyEntity, dataSource);
  }

  async findByUserAndExchange(
    user: UserEntity,
    exchangeName: string,
  ): Promise<ExchangeAPIKeyEntity | undefined> {
    return this.findOne({
      where: {
        user,
        exchangeName: exchangeName.toLowerCase(),
      },
    });
  }
}
