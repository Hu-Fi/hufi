import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '../../database/base.repository';
import { CampaignEntity } from '../../database/entities';

@Injectable()
export class CampaignRepository extends BaseRepository<CampaignEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(CampaignEntity, dataSource);
  }

  findAll(): Promise<CampaignEntity[]> {
    return this.find({ relations: { users: true } });
  }

  findById(id: string): Promise<CampaignEntity | null> {
    return this.findOne({ where: { id }, relations: { users: true } });
  }

  findOneByChainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<CampaignEntity | null> {
    return this.findOne({
      where: { chainId, address: address.toLowerCase() },
      relations: { users: true },
    });
  }
}
