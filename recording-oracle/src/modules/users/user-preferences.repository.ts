import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { UserPreferencesEntity } from './user-preferences.entity';
import type { UserEntity } from './user.entity';

@Injectable()
export class UserPreferencesRepository extends Repository<UserPreferencesEntity> {
  constructor(private readonly dataSource: DataSource) {
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
      .where(
        `(preferences.campaignsAutojoin ->> 'enabled')::boolean = :enabled`,
        {
          enabled: true,
        },
      )
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

  async removeExchangeFromAutojoin(
    userId: string,
    exchangeName: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (txManager) => {
      const userPreferencesRepository = txManager.getRepository(
        UserPreferencesEntity,
      );

      const userPreferences = await userPreferencesRepository.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!userPreferences) {
        return;
      }

      const exchanges = new Set(userPreferences.campaignsAutojoin.exchanges);
      exchanges.delete(exchangeName);
      userPreferences.campaignsAutojoin.exchanges = Array.from(exchanges);

      userPreferences.updatedAt = new Date();

      await userPreferencesRepository.save(userPreferences);
    });
  }
}
