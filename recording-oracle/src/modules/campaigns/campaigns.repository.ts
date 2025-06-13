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

  async findOneByAddress(address: string): Promise<CampaignEntity | null> {
    return this.findOne({
      where: { address },
    });
  }
}
