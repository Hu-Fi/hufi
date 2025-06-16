import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CampaignEntity } from './campaign.entity';

@Injectable()
export class CampaignsRepository extends Repository<CampaignEntity> {
  constructor(dataSource: DataSource) {
    super(CampaignEntity, dataSource.createEntityManager());
  }

  async findOneById(id: string): Promise<CampaignEntity | null> {
    return this.findOne({
      where: { id },
    });
  }

  async findOneByChainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<CampaignEntity | null> {
    return this.findOne({
      where: { chainId, address },
    });
  }
}
