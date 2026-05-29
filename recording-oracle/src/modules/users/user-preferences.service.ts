import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import _ from 'lodash';

import { NotificationsConfigService } from '@/config';

import {
  DEFAULT_USER_PREFERENCES,
  PREFERENCES_VALIDATION_SCHEMA,
} from './constants';
import type { TelegramJwtPayload } from './types';
import { LinkedTelegramDto, UpdatePreferencesDto } from './user-me.dto';
import { UserPreferencesEntity } from './user-preferences.entity';
import {
  InvalidUserPreferencesError,
  TelegramTokenVerificationError,
} from './user-preferences.error';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';

@Injectable()
export class UserPreferencesService {
  private readonly telegramJwks: ReturnType<typeof jose.createRemoteJWKSet>;

  constructor(
    private readonly notificationsConfigService: NotificationsConfigService,
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly usersRepository: UsersRepository,
  ) {
    this.telegramJwks = jose.createRemoteJWKSet(
      new URL('https://oauth.telegram.org/.well-known/jwks.json'),
    );
  }

  private assertPreferencesValid(
    userId: string,
    newPreferences: UpdatePreferencesDto,
    context: Pick<UserPreferencesEntity, 'telegramUserId'>,
  ): void {
    /**
     * Right now unknown values are stripped by the API layer,
     * but use this schema validation check as a safety belt to make sure that
     * no invalid data is saved to the database.
     */
    const schemaValidationResult =
      PREFERENCES_VALIDATION_SCHEMA.validate(newPreferences);
    if (schemaValidationResult.error) {
      throw new InvalidUserPreferencesError(
        userId,
        'Provided preferences do not match the expected schema',
      );
    }
    // @ts-expect-error - safety belt from abuse data and missing API validation
    if (newPreferences.telegramUserId) {
      throw new InvalidUserPreferencesError(
        userId,
        'Telegram user ID cannot be updated directly',
      );
    }

    // =========== NOTIFICATIONS CHECKS START ===========
    const hasSomeNotificationOn = Object.values(
      newPreferences.notifications || {},
    ).some((notificationPreference) => notificationPreference);
    if (hasSomeNotificationOn && !context.telegramUserId) {
      throw new InvalidUserPreferencesError(
        userId,
        'Telegram must be linked to enable notifications',
      );
    }
    // =========== NOTIFICATIONS CHECKS END ===========

    // =========== CAMPAIGNS AUTOJOIN CHECKS START ===========
    const campaignsAutojoinPreferences =
      newPreferences.campaignsAutojoin ||
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
    // =========== CAMPAIGNS AUTOJOIN CHECKS END ===========
  }

  private async hydrateAndUpsert(
    userId: string,
    preferencesToUpdate: Partial<UserPreferencesEntity>,
    existingPreferences?: UserPreferencesEntity,
  ) {
    const preferences = new UserPreferencesEntity();

    Object.assign(
      preferences,
      {
        userId,
        createdAt: new Date(),
      },
      DEFAULT_USER_PREFERENCES,
      existingPreferences,
      preferencesToUpdate,
    );

    preferences.campaignsAutojoin.exchanges = _.uniq(
      preferences.campaignsAutojoin.exchanges,
    );
    preferences.campaignsAutojoin.campaignTypes = _.uniq(
      preferences.campaignsAutojoin.campaignTypes,
    );
    preferences.campaignsAutojoin.tokens = _.uniq(
      preferences.campaignsAutojoin.tokens,
    );

    preferences.updatedAt = new Date();

    return await this.userPreferencesRepository.save(preferences);
  }

  async update(
    userId: string,
    preferences: UpdatePreferencesDto,
  ): Promise<UserPreferencesEntity> {
    const user = await this.usersRepository.findOneById(userId, {
      relations: { preferences: true },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    this.assertPreferencesValid(
      userId,
      preferences,
      user.preferences || DEFAULT_USER_PREFERENCES,
    );

    return await this.hydrateAndUpsert(userId, preferences, user.preferences);
  }

  async linkTelegram(
    userId: string,
    idToken: string,
  ): Promise<LinkedTelegramDto> {
    const user = await this.usersRepository.findOneById(userId, {
      relations: { preferences: true },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    try {
      const { payload } = await jose.jwtVerify<TelegramJwtPayload>(
        idToken,
        this.telegramJwks,
        {
          issuer: 'https://oauth.telegram.org',
          audience: this.notificationsConfigService.hufiTgBotClientId,
          /**
           * TG's default expiration is 30 seconds, but add some small clock tolerance
           * to cover possible delays in the request and JWT verification process;
           */
          clockTolerance: '60 seconds',
        },
      );

      const telegramUserId = payload.id;

      await this.hydrateAndUpsert(userId, { telegramUserId }, user.preferences);

      return { telegramUserId };
    } catch (error) {
      if (error instanceof jose.errors.JOSEError) {
        throw new TelegramTokenVerificationError(userId, error.code);
      }
      throw error;
    }
  }

  async unlinkTelegram(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneById(userId, {
      relations: { preferences: true },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    await this.userPreferencesRepository.update(userId, {
      telegramUserId: null,
      updatedAt: new Date(),
    });
  }
}
