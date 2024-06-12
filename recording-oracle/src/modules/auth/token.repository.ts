import { Injectable } from '@nestjs/common';
import { DataSource, DeleteResult } from 'typeorm';

import { TokenType } from '../../common/enums/token';
import { BaseRepository } from '../../database/base.repository';
import { TokenEntity } from '../../database/entities';

@Injectable()
export class TokenRepository extends BaseRepository<TokenEntity> {
  constructor(private dataSource: DataSource) {
    super(TokenEntity, dataSource);
  }

  public async findOneById(id: string): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        id,
      },
      relations: ['user'],
    });
  }

  public async findOneByUserIdAndType(
    userId: string,
    type: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        userId,
        type,
      },
      relations: ['user'],
    });
  }

  public async deleteOne(token: TokenEntity): Promise<DeleteResult> {
    return this.delete({ id: token.id });
  }

  public async deleteOneByUserIdAndType(
    userId: string,
    type: TokenType,
  ): Promise<DeleteResult> {
    return this.delete({ userId, type });
  }
}
