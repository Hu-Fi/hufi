import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';

import { RefreshTokenEntity } from './token.entity';

type FindOptions = {
  relations?: FindManyOptions<RefreshTokenEntity>['relations'];
};

@Injectable()
export class TokenRepository extends Repository<RefreshTokenEntity> {
  constructor(dataSource: DataSource) {
    super(RefreshTokenEntity, dataSource.createEntityManager());
  }

  async findOneByUserId(
    userId: string,
    options: FindOptions = {},
  ): Promise<RefreshTokenEntity | null> {
    return this.findOne({
      where: {
        userId,
      },
      relations: options.relations,
    });
  }
}
