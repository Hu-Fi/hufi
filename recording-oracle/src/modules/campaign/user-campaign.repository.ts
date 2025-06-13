import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';

import { UserCampaignEntity } from './user-campaign.entity';

type FindOptions = {
  relations?: FindManyOptions<UserCampaignEntity>['relations'];
};

@Injectable()
export class UserCampaignRepository extends Repository<UserCampaignEntity> {
  constructor(dataSource: DataSource) {
    super(UserCampaignEntity, dataSource.createEntityManager());
  }

  async findOneByUserIdAndCampaignId(
    userId: string,
    campaignId: string,
    options: FindOptions = {},
  ): Promise<UserCampaignEntity | null> {
    return this.findOne({
      where: { userId, campaignId },
      relations: options.relations,
    });
  }
}
