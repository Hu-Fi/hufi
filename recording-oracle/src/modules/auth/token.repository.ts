import { Injectable } from '@nestjs/common';
import { DataSource, DeleteResult } from 'typeorm';

import { TokenType } from '../../common/enums/token';
import { BaseRepository } from '../../database/base.repository';
import { TokenEntity } from '../../database/entities';

@Injectable()
export class TokenRepository extends BaseRepository<TokenEntity> {
  constructor(ds: DataSource) {
    super(TokenEntity, ds);
  }

  findOneById(id: string): Promise<TokenEntity | null> {
    return this.findOne({ where: { id }, relations: ['user'] });
  }

  findOneByUserIdAndType(
    userId: string,
    type: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: { user: { id: userId }, type },
      relations: ['user'],
    });
  }

  deleteOne(token: TokenEntity): Promise<DeleteResult> {
    return this.delete({ id: token.id });
  }

  deleteOneByUserIdAndType(
    userId: string,
    type: TokenType,
  ): Promise<DeleteResult> {
    return this.delete({ user: { id: userId }, type });
  }
}
