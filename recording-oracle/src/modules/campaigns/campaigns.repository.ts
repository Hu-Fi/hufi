import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { DataSource, Repository } from 'typeorm';

import { CampaignEntity } from './campaign.entity';
import { CampaignStatus } from './types';

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

  async findForProgressCheck(): Promise<CampaignEntity[]> {
    const dayAgo = dayjs().subtract(1, 'day').toDate();

    const results = await this.createQueryBuilder('campaign')
      .where('campaign.status = :status', { status: CampaignStatus.ACTIVE })
      .andWhere('campaign.startDate <= :dayAgo', { dayAgo })
      .andWhere(
        '(campaign.lastResultsAt IS NULL OR campaign.lastResultsAt <= :dayAgo)',
        {
          dayAgo,
        },
      )
      .getMany();

    return results;
  }
}
