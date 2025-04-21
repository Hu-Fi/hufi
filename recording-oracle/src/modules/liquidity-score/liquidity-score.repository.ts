import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '../../database/base.repository';
import {
  CampaignEntity,
  LiquidityScoreEntity,
  UserEntity,
} from '../../database/entities';

@Injectable()
export class LiquidityScoreRepository extends BaseRepository<LiquidityScoreEntity> {
  constructor(private dataSource: DataSource) {
    super(LiquidityScoreEntity, dataSource);
  }

  async findAll(): Promise<LiquidityScoreEntity[]> {
    return this.find();
  }

  async findById(id: string): Promise<LiquidityScoreEntity | null> {
    return this.findOne({ where: { id } });
  }

  async findByUser(user: UserEntity): Promise<LiquidityScoreEntity[]> {
    return this.find({ where: { user } });
  }

  async findByCampaign(
    campaign: CampaignEntity,
  ): Promise<LiquidityScoreEntity[]> {
    return this.find({ where: { campaign } });
  }
}
