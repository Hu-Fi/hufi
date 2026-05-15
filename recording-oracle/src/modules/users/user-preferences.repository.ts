import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { UserPreferencesEntity } from './user-preferences.entity';
import type { UserEntity } from './user.entity';

@Injectable()
export class UserPreferencesRepository extends Repository<UserPreferencesEntity> {
  constructor(dataSource: DataSource) {
    super(UserPreferencesEntity, dataSource.createEntityManager());
  }

  async findForAutojoin({
    exchange,
    campaignType,
    token,
  }: {
    exchange: string;
    campaignType: string;
    token: string;
  }): Promise<UserEntity[]> {
    const query = this.createQueryBuilder('preferences')
      .leftJoinAndSelect('preferences.user', 'user')
      .where(`preferences.campaignsAutojoin ->> 'enabled' = :enabled`, {
        enabled: true,
      })
      .andWhere(`preferences.campaignsAutojoin -> 'exchanges' ? :exchange`, {
        exchange,
      })
      .andWhere(
        `preferences.campaignsAutojoin -> 'campaignTypes' ? :campaignType`,
        {
          campaignType,
        },
      )
      .andWhere(`preferences.campaignsAutojoin -> 'tokens' ? :token`, {
        token,
      });

    const usersPreferences = await query.getMany();

    return usersPreferences.map((up) => up.user! as UserEntity);
  }
}
