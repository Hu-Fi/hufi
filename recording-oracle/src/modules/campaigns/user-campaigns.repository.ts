import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import type { UserEntity } from '@/modules/users';

import { CampaignEntity } from './campaign.entity';
import { CampaignStatus } from './types';
import { UserCampaignEntity } from './user-campaign.entity';

@Injectable()
export class UserCampaignsRepository extends Repository<UserCampaignEntity> {
  constructor(dataSource: DataSource) {
    super(UserCampaignEntity, dataSource.createEntityManager());
  }

  async findByUserId(
    userId: string,
    options: {
      statuses?: CampaignStatus[];
      limit?: number;
      skip?: number;
    } = {},
  ): Promise<CampaignEntity[]> {
    const query = this.createQueryBuilder('userCampaign')
      .leftJoinAndSelect('userCampaign.campaign', 'campaign')
      .where('userCampaign.userId = :userId', { userId });

    if (options.statuses?.length) {
      query.andWhere('campaign.status IN (:...statuses)', {
        statuses: options.statuses,
      });
    }

    query.orderBy('campaign.startDate').skip(options.skip).limit(options.limit);

    const userCampaigns = await query.getMany();

    return userCampaigns.map((uc) => uc.campaign as CampaignEntity);
  }

  async checkUserJoinedCampaign(
    userId: string,
    campaignId: string,
  ): Promise<boolean> {
    return this.existsBy({ userId, campaignId });
  }

  async findCampaignUsers(campaignId: string): Promise<UserEntity[]> {
    const userCampaigns = await this.find({
      where: { campaignId },
      relations: {
        user: true,
      },
    });

    return userCampaigns.map((e) => e.user as UserEntity);
  }

  async removeUserFromActiveCampaigns(
    userId: string,
    exchangeNames: string[],
  ): Promise<void> {
    /**
     * TODO: update this query with `to_cancel` campaign when ready
     */
    const activeCampaignIdsQuery = this.manager
      .createQueryBuilder()
      .select('campaign.id')
      .from(CampaignEntity, 'campaign')
      .where('campaign.status = :status', { status: CampaignStatus.ACTIVE });

    if (exchangeNames.length) {
      activeCampaignIdsQuery.andWhere(
        'campaign.exchangeName IN (:...exchangeNames)',
        { exchangeNames },
      );
    }

    const removalOp = this.createQueryBuilder('userCampaign')
      .delete()
      .where('userCampaign.userId = :userId', { userId })
      .andWhere(
        `"userCampaign.campaignId IN (${activeCampaignIdsQuery.getQuery()})`,
      );

    await removalOp.execute();
  }
}
