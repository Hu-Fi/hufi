import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import type { UserEntity } from '@/modules/users';

import type { CampaignEntity } from './campaign.entity';
import { CampaignStatus } from './types';
import { UserCampaignEntity } from './user-campaign.entity';

type FindOptions = {
  status?: CampaignStatus;
  limit?: number;
  skip?: number;
};

@Injectable()
export class UserCampaignsRepository extends Repository<UserCampaignEntity> {
  constructor(dataSource: DataSource) {
    super(UserCampaignEntity, dataSource.createEntityManager());
  }

  async findByUserId(
    userId: string,
    options: FindOptions = {},
  ): Promise<CampaignEntity[]> {
    const query = this.createQueryBuilder('userCampaign')
      .leftJoinAndSelect('userCampaign.campaign', 'campaign')
      .where('userCampaign.userId = :userId', { userId });

    if (options.status) {
      query.andWhere('campaign.status = :status', { status: options.status });
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
}
