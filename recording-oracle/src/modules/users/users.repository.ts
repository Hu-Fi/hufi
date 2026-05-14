import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';

import { UserEntity } from './user.entity';

type FindOptions = {
  relations?: FindManyOptions<UserEntity>['relations'];
};

@Injectable()
export class UsersRepository extends Repository<UserEntity> {
  constructor(dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  async findOneById(
    id: string,
    options: FindOptions = {},
  ): Promise<UserEntity | null> {
    return this.findOne({
      where: { id },
      relations: options.relations,
    });
  }

  async findOneByEvmAddress(
    address: string,
    options: FindOptions = {},
  ): Promise<UserEntity | null> {
    return this.findOne({
      where: { evmAddress: address },
      relations: options.relations,
    });
  }

  async updateOneById(
    id: string,
    partialEntity: Partial<UserEntity>,
  ): Promise<boolean> {
    const result = await this.update(id, {
      ...partialEntity,
      updatedAt: new Date(),
    });

    if (result.affected === undefined) {
      throw new Error(
        'Driver "update" operation does not provide expected result',
      );
    }

    return result.affected > 0;
  }

  async existsById(userId: string): Promise<boolean> {
    return this.existsBy({ id: userId });
  }
}
