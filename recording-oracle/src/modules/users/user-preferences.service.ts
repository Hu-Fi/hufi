import { Injectable } from '@nestjs/common';
import _ from 'lodash';

import { DEFAULT_USER_PREFERENCES } from './constants';
import { UpdatePreferencesDto } from './user-me.dto';
import { UserPreferencesEntity } from './user-preferences.entity';
import { InvalidUserPreferencesError } from './user-preferences.error';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  private assertPreferencesValid(
    userId: string,
    preferences: UpdatePreferencesDto,
  ): void {
    // assert notification preferences
    const notificationPreferences =
      preferences.notifications || DEFAULT_USER_PREFERENCES.notifications;

    if (!notificationPreferences.telegramUserId) {
      for (const [
        notificationPreferenceKey,
        notificationPreference,
      ] of Object.entries(notificationPreferences)) {
        if (notificationPreferenceKey === 'telegramUserId') {
          continue;
        }

        if (typeof notificationPreference !== 'boolean') {
          throw new Error('Unexpected preferences format');
        }

        if (notificationPreference) {
          throw new InvalidUserPreferencesError(
            userId,
            'telegramUserId is required to enable notifications',
          );
        }
      }
    }

    // assert campaigns autojoin preferences
    const campaignsAutojoinPreferences =
      preferences.campaignsAutojoin ||
      DEFAULT_USER_PREFERENCES.campaignsAutojoin;
    if (campaignsAutojoinPreferences.enabled) {
      if (
        campaignsAutojoinPreferences.campaignTypes.length === 0 ||
        campaignsAutojoinPreferences.exchanges.length === 0 ||
        campaignsAutojoinPreferences.tokens.length === 0
      ) {
        throw new InvalidUserPreferencesError(
          userId,
          'Autojoin should have filters when enabled',
        );
      }
    }
  }

  async update(
    userId: string,
    preferences: UpdatePreferencesDto,
  ): Promise<UserPreferencesEntity> {
    this.assertPreferencesValid(userId, preferences);

    const user = await this.usersRepository.findOneById(userId, {
      relations: { preferences: true },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const newPreferences = new UserPreferencesEntity();
    Object.assign(
      newPreferences,
      {
        userId,
        createdAt: new Date(),
      },
      DEFAULT_USER_PREFERENCES,
      user.preferences,
      preferences,
    );

    newPreferences.campaignsAutojoin.exchanges = _.uniq(
      newPreferences.campaignsAutojoin.exchanges,
    );
    newPreferences.campaignsAutojoin.campaignTypes = _.uniq(
      newPreferences.campaignsAutojoin.campaignTypes,
    );
    newPreferences.campaignsAutojoin.tokens = _.uniq(
      newPreferences.campaignsAutojoin.tokens,
    );

    newPreferences.updatedAt = new Date();

    return await this.userPreferencesRepository.save(newPreferences);
  }
}
