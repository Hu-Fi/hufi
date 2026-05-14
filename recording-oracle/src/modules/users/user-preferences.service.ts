import { Injectable } from '@nestjs/common';
import _ from 'lodash';

import { DEFAULT_USER_PREFERENCES } from './constants';
import { UpdatePreferencesDto } from './user-me.dto';
import type { UserPreferencesEntity } from './user-preferences.entity';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async savePreferences(
    userId: string,
    preferences: UpdatePreferencesDto,
  ): Promise<UserPreferencesEntity> {
    const user = await this.usersRepository.findOneById(userId, {
      relations: { preferences: true },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const newPreferences = this.userPreferencesRepository.create(
      _.merge(
        {
          userId,
          createdAt: new Date(),
        },
        DEFAULT_USER_PREFERENCES,
        user.preferences,
        preferences,
      ),
    );
    newPreferences.updatedAt = new Date();

    newPreferences.campaignsAutojoin.exchanges = _.uniq(
      newPreferences.campaignsAutojoin.exchanges,
    );
    newPreferences.campaignsAutojoin.campaignTypes = _.uniq(
      newPreferences.campaignsAutojoin.campaignTypes,
    );
    newPreferences.campaignsAutojoin.tokens = _.uniq(
      newPreferences.campaignsAutojoin.tokens,
    );

    return await this.userPreferencesRepository.save(newPreferences);
  }
}
