import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '../../database/base.repository';
import { LiquidityScoreEntity, UserEntity } from '../../database/entities';

@Injectable()
export class LiquidityScoreRepository extends BaseRepository<LiquidityScoreEntity> {
  constructor(private dataSource: DataSource) {
    super(LiquidityScoreEntity, dataSource);
  }

  async findAll(): Promise<LiquidityScoreEntity[]> {
    return this.findAll();
  }

  async findById(id: string): Promise<LiquidityScoreEntity | null> {
    return this.findOne({ where: { id } });
  }

  async findByUser(user: UserEntity): Promise<LiquidityScoreEntity[]> {
    return this.find({ where: { user } });
  }

  async findLastByCampaignId(
    campaignId: string,
  ): Promise<LiquidityScoreEntity | null> {
    return this.findOne({
      where: { campaignId },
      order: { windowEnd: 'DESC' },
    });
  }
}
