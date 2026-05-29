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
     * no invalid date is saved to the database.
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

      await this.userPreferencesRepository.update(userId, {
        telegramUserId,
        updatedAt: new Date(),
      });

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
