import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';

import type { UserEntity } from '@/modules/users';

import { UserCampaignEntity } from './user-campaign.entity';

type FindOptions = {
  relations?: FindManyOptions<UserCampaignEntity>['relations'];
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
  ): Promise<UserCampaignEntity[]> {
    return this.find({
      where: { userId },
      relations: options.relations,
      skip: options.skip,
      take: options.limit,
    });
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
