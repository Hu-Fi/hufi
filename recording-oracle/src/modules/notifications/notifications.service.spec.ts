import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { Test } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import {
  RECORDING_ORACLE_ADDRESS_HEADER,
  RECORDING_ORACLE_SIGNATURE_HEADER,
} from '@/common/constants';
import * as httpUtils from '@/common/utils/http';
import * as web3Utils from '@/common/utils/web3';
import { NotificationsConfigService, Web3ConfigService } from '@/config';
import logger from '@/logger';
import {
  generateUserEntity,
  generateUserPreferences,
} from '@/modules/users/fixtures';
import { UserPreferencesRepository } from '@/modules/users/user-preferences.repository';
import { mockWeb3ConfigService } from '@/modules/web3/fixtures';

import { mockNotificationsConfigService } from './fixtures';
import { NotificationsService } from './notifications.service';
import { type CampaignAutojoinPayload, NotificationType } from './types';

vi.mock('@/logger');
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');

  return {
    ...actual,
    default: {
      ...actual,
      post: vi.fn(),
    },
    post: vi.fn(),
  };
});

const mockAxiosPost = vi.mocked(axios.post);

const mockUserPreferencesRepository = createMock<UserPreferencesRepository>();

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsConfigService,
          useValue: mockNotificationsConfigService,
        },
        {
          provide: UserPreferencesRepository,
          useValue: mockUserPreferencesRepository,
        },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
      ],
    }).compile();

    notificationsService =
      moduleRef.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('should be defined', () => {
    expect(notificationsService).toBeDefined();
  });

  describe('maybeSendNotification', () => {
    test('should return when HuFi TG bot URL is not set', async () => {
      const originalTgBotUrl = mockNotificationsConfigService.hufiTgBotUrl;

      (mockNotificationsConfigService as any).hufiTgBotUrl = '';

      try {
        await notificationsService.maybeSendNotification(
          faker.string.uuid(),
          // @ts-expect-error - won't use it
          faker.lorem.slug(),
          {},
        );

        expect(mockUserPreferencesRepository.findOneById).toHaveBeenCalledTimes(
          0,
        );
        expect(mockAxiosPost).toHaveBeenCalledTimes(0);
      } finally {
        (mockNotificationsConfigService as any).hufiTgBotUrl = originalTgBotUrl;
      }
    });

    test('should return when no user preferences', async () => {
      const userId = faker.string.uuid();
      mockUserPreferencesRepository.findOneById.mockResolvedValueOnce(null);

      await notificationsService.maybeSendNotification(
        userId,
        // @ts-expect-error - won't use it
        faker.lorem.slug(),
        {},
      );

      expect(mockUserPreferencesRepository.findOneById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockUserPreferencesRepository.findOneById).toHaveBeenCalledWith(
        userId,
        {
          relations: {
            user: true,
          },
        },
      );
      expect(mockAxiosPost).toHaveBeenCalledTimes(0);
    });

    test('should return when user has no telegram user id', async () => {
      const preferences = generateUserPreferences({
        notifications: {
          campaignsAutojoin: true,
        },
      });
      mockUserPreferencesRepository.findOneById.mockResolvedValueOnce(
        preferences,
      );

      await notificationsService.maybeSendNotification(
        preferences.userId,
        // @ts-expect-error - won't use it
        faker.lorem.slug(),
        {},
      );

      expect(mockAxiosPost).toHaveBeenCalledTimes(0);
    });

    test('should return when notification type does not exist in preferences', async () => {
      const preferences = generateUserPreferences({
        telegramUserId: faker.number.int().toString(),
      });
      mockUserPreferencesRepository.findOneById.mockResolvedValueOnce(
        preferences,
      );

      await notificationsService.maybeSendNotification(
        preferences.userId,
        // @ts-expect-error - won't use it
        faker.lorem.slug(),
        {},
      );

      expect(mockAxiosPost).toHaveBeenCalledTimes(0);
    });

    test('should sign and send notification when enabled', async () => {
      const payload: CampaignAutojoinPayload = {
        chainId: faker.number.int(),
        campaignAddress: faker.finance.ethereumAddress(),
        timestamp: faker.date.recent().valueOf(),
      };

      const userId = faker.string.uuid();
      const user = generateUserEntity({ id: userId });
      const preferences = generateUserPreferences({
        userId,
        user,
        telegramUserId: faker.number.int().toString(),
        notifications: {
          campaignsAutojoin: true,
        },
      });
      mockUserPreferencesRepository.findOneById.mockResolvedValueOnce(
        preferences,
      );

      await notificationsService.maybeSendNotification(
        userId,
        NotificationType.CAMPAIGN_AUTOJOIN,
        payload,
      );

      const expectedWebhookPayload = {
        type: NotificationType.CAMPAIGN_AUTOJOIN,
        telegramUserId: preferences.telegramUserId,
        userId,
        userEvmAddress: user.evmAddress,
        ...payload,
      };
      const expectedSignature = await web3Utils.signMessage(
        expectedWebhookPayload,
        mockWeb3ConfigService.privateKey,
      );

      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        mockNotificationsConfigService.hufiTgBotUrl,
        expectedWebhookPayload,
        {
          headers: {
            [RECORDING_ORACLE_SIGNATURE_HEADER]: expectedSignature,
            [RECORDING_ORACLE_ADDRESS_HEADER]:
              mockWeb3ConfigService.operatorAddress,
          },
        },
      );
    });

    test('should format axios errors before logging', async () => {
      const userId = faker.string.uuid();
      const user = generateUserEntity({ id: userId });
      const payload = {
        chainId: faker.number.int({ min: 1 }),
        campaignAddress: faker.finance.ethereumAddress(),
        timestamp: faker.number.int({ min: 1 }),
      };
      const preferences = generateUserPreferences({
        userId,
        user,
        telegramUserId: faker.number.int().toString(),
        notifications: {
          campaignsAutojoin: true,
        },
      });

      mockUserPreferencesRepository.findOneById.mockResolvedValueOnce(
        preferences,
      );

      const axiosError = new AxiosError(faker.lorem.sentence());
      mockAxiosPost.mockRejectedValueOnce(axiosError);

      const formattedError = httpUtils.formatAxiosError(axiosError);

      await notificationsService.maybeSendNotification(
        userId,
        NotificationType.CAMPAIGN_AUTOJOIN,
        payload,
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error while trying to send notification',
        {
          userId,
          notification: {
            type: NotificationType.CAMPAIGN_AUTOJOIN,
            payload,
          },
          error: formattedError,
        },
      );
    });
  });
});
