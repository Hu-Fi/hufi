import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';

import { UserCampaignEntity } from './user-campaign.entity';

type FindOptions = {
  relations?: FindManyOptions<UserCampaignEntity>['relations'];
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
    return this.find({ where: { userId }, relations: options.relations });
  }

  async checkUserJoinedCampaign(
    userId: string,
    campaignId: string,
  ): Promise<boolean> {
    return this.existsBy({ userId, campaignId });
  }
}
