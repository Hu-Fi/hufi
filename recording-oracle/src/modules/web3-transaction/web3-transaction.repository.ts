import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '../../database/base.repository';
import { Web3TransactionEntity } from '../../database/entities';

@Injectable()
export class Web3TransactionRepository extends BaseRepository<Web3TransactionEntity> {
  constructor(private dataSource: DataSource) {
    super(Web3TransactionEntity, dataSource);
  }
}
