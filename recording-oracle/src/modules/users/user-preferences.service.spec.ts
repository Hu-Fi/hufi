import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { Test } from '@nestjs/testing';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

import { NotificationsConfigService } from '@/config';
import { mockNotificationsConfigService } from '@/modules/notifications/fixtures';

import { DEFAULT_USER_PREFERENCES } from './constants';
import { generateUserEntity, generateUserPreferences } from './fixtures';
import { InvalidUserPreferencesError } from './user-preferences.error';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UserPreferencesService } from './user-preferences.service';
import type { UserEntity } from './user.entity';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';

const mockUsersRepository = createMock<UsersRepository>();
const mockUserPreferencesRepository = createMock<UserPreferencesRepository>();

describe('UserPreferencesService', () => {
  let userPreferencesService: UserPreferencesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserPreferencesService,
        {
          provide: NotificationsConfigService,
          useValue: mockNotificationsConfigService,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: UserPreferencesRepository,
          useValue: mockUserPreferencesRepository,
        },
      ],
    }).compile();

    userPreferencesService = moduleRef.get<UserPreferencesService>(
      UserPreferencesService,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('should be defined', () => {
    expect(userPreferencesService).toBeDefined();
  });

  describe('update', () => {
    let user: UserEntity;

    beforeEach(() => {
      user = generateUserEntity();

      mockUserPreferencesRepository.save.mockImplementationOnce(
        // @ts-expect-error - no need to have exact TypeORM type here
        async (entity) => entity,
      );
    });

    test('should throw when user does not exist', async () => {
      mockUsersRepository.findOneById.mockReset().mockResolvedValueOnce(null);

      let thrownError: any;
      try {
        await userPreferencesService.update(user.id, {});
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(UserNotFoundError);
      expect(thrownError.identifier).toBe(user.id);

      expect(mockUsersRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(mockUsersRepository.findOneById).toHaveBeenCalledWith(user.id, {
        relations: { preferences: true },
      });
    });

    test('should throw when try to update telegramUserId directly', async () => {
      mockUsersRepository.findOneById.mockResolvedValueOnce(user);

      let thrownError: any;
      try {
        await userPreferencesService.update(user.id, {
          // @ts-expect-error - simulate abuse data
          telegramUserId: faker.number.int().toString(),
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidUserPreferencesError);
      expect(thrownError.userId).toBe(user.id);
      expect(thrownError.message).toBe(
        'Telegram user ID cannot be updated directly',
      );
    });

    test('should save with default values when user does not have existing preferences', async () => {
      mockUsersRepository.findOneById.mockResolvedValueOnce(user);

      const now = new Date();
      vi.useFakeTimers({ now });

      const saved = await userPreferencesService.update(user.id, {});

      vi.useRealTimers();

      expect(saved.userId).toBe(user.id);
      expect(saved.createdAt).toEqual(now);
      expect(saved.updatedAt).toEqual(now);
      expect(saved.telegramUserId).toBeNull();
      expect(saved.campaignsAutojoin).toEqual(
        DEFAULT_USER_PREFERENCES.campaignsAutojoin,
      );
      expect(saved.notifications).toEqual(
        DEFAULT_USER_PREFERENCES.notifications,
      );
    });

    test('should overwrite existing user preferences with new preferences', async () => {
      /**
       * Old prefs should have more filters than new ones, so we can check
       * that new values actually overwrite old ones, not merged by index
       */
      const existingPreferences = generateUserPreferences({
        campaignsAutojoin: {
          enabled: faker.datatype.boolean(),
          exchanges: Array.from({ length: 2 }, () => faker.lorem.word()),
          campaignTypes: Array.from({ length: 2 }, () => faker.lorem.word()),
          tokens: Array.from({ length: 2 }, () => faker.lorem.word()),
        },
        telegramUserId: faker.number.int().toString(),
        notifications: {
          campaignsAutojoin: faker.datatype.boolean(),
        },
      });

      mockUsersRepository.findOneById.mockResolvedValueOnce({
        ...user,
        preferences: existingPreferences,
      });

      const newExchange = faker.lorem.word();
      const newCampaignType = faker.lorem.word();
      const newToken = faker.lorem.word();

      const result = await userPreferencesService.update(user.id, {
        campaignsAutojoin: {
          enabled: !existingPreferences.campaignsAutojoin.enabled,
          exchanges: [newExchange],
          campaignTypes: [newCampaignType],
          tokens: [newToken],
        },
        notifications: {
          campaignsAutojoin:
            !existingPreferences.notifications.campaignsAutojoin,
        },
      });

      expect(result.campaignsAutojoin.enabled).toBe(
        !existingPreferences.campaignsAutojoin.enabled,
      );
      expect(result.campaignsAutojoin.exchanges).toEqual([newExchange]);
      expect(result.campaignsAutojoin.campaignTypes).toEqual([newCampaignType]);
      expect(result.campaignsAutojoin.tokens).toEqual([newToken]);

      expect(result.notifications.campaignsAutojoin).not.toEqual(
        existingPreferences.notifications.campaignsAutojoin,
      );
    });

    test('should deduplicate array values', async () => {
      const existingPreferences = generateUserPreferences({
        campaignsAutojoin: {
          enabled: faker.datatype.boolean(),
          exchanges: [faker.lorem.word()],
          campaignTypes: [faker.lorem.word()],
          tokens: [faker.lorem.word()],
        },
      });

      mockUsersRepository.findOneById.mockResolvedValueOnce({
        ...user,
        preferences: existingPreferences,
      });

      const result = await userPreferencesService.update(user.id, {
        campaignsAutojoin: {
          enabled: faker.datatype.boolean(),
          exchanges: [
            ...existingPreferences.campaignsAutojoin.exchanges,
            ...existingPreferences.campaignsAutojoin.exchanges,
          ],
          campaignTypes: [
            ...existingPreferences.campaignsAutojoin.campaignTypes,
            ...existingPreferences.campaignsAutojoin.campaignTypes,
          ],
          tokens: [
            ...existingPreferences.campaignsAutojoin.tokens,
            ...existingPreferences.campaignsAutojoin.tokens,
          ],
        },
      });

      expect(result.campaignsAutojoin.exchanges.sort()).toEqual(
        existingPreferences.campaignsAutojoin.exchanges.sort(),
      );

      expect(result.campaignsAutojoin.campaignTypes.sort()).toEqual(
        existingPreferences.campaignsAutojoin.campaignTypes.sort(),
      );

      expect(result.campaignsAutojoin.tokens.sort()).toEqual(
        existingPreferences.campaignsAutojoin.tokens.sort(),
      );
    });
  });
});
