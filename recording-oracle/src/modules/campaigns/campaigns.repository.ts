import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { DataSource, In, Repository } from 'typeorm';

import { CampaignEntity } from './campaign.entity';
import { PROGRESS_PERIOD_DAYS } from './constants';
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

  async findForProgressRecording(): Promise<CampaignEntity[]> {
    const now = new Date();
    const timeAgo = dayjs().subtract(PROGRESS_PERIOD_DAYS, 'day').toDate();

    const results = await this.createQueryBuilder('campaign')
      .where(
        `
          campaign.status = '${CampaignStatus.TO_CANCEL}'
          OR (campaign.status = '${CampaignStatus.ACTIVE}'
            AND (
              campaign.endDate <= :now
              OR (campaign.startDate <= :timeAgo AND campaign.lastResultsAt IS NULL)
              OR campaign.lastResultsAt <= :timeAgo
            )
          )
        `,
        {
          now,
          timeAgo,
        },
      )
      .getMany();

    return results;
  }

  async findForStatusSync(): Promise<CampaignEntity[]> {
    return this.find({
      where: {
        status: In([
          CampaignStatus.ACTIVE,
          CampaignStatus.TO_CANCEL,
          CampaignStatus.PENDING_COMPLETION,
          CampaignStatus.PENDING_CANCELLATION,
        ]),
      },
    });
  }

  async findLatestCampaignForChain(
    chainId: number,
  ): Promise<CampaignEntity | null> {
    return this.findOne({
      where: {
        chainId,
      },
      order: {
        createdAt: 'desc',
      },
    });
  }

  async checkCampaignExists(
    chainId: number,
    address: string,
  ): Promise<boolean> {
    return this.existsBy({ chainId, address });
  }
}
