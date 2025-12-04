jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import logger from '@/logger';

import {
  ExchangeApiClientFactory,
  ExchangeApiClient,
  ExchangePermission,
} from './api-client';
import {
  ExchangeApiKeysService,
  KeyAuthorizationError,
} from './exchange-api-keys';
import { generateExchangeApiKeysData } from './exchange-api-keys/fixtures';
import { ExchangesService } from './exchanges.service';

const mockExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();
const mockExchangeApiKeysService = createMock<ExchangeApiKeysService>();

const exchangePermissions = Object.values(ExchangePermission);

describe('ExchangesService', () => {
  let exchangesService: ExchangesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangesService,
        {
          provide: ExchangeApiClientFactory,
          useValue: mockExchangeApiClientFactory,
        },
        {
          provide: ExchangeApiKeysService,
          useValue: mockExchangeApiKeysService,
        },
      ],
    }).compile();

    exchangesService = moduleRef.get<ExchangesService>(ExchangesService);
  });

  it('should be defined', () => {
    expect(exchangesService).toBeDefined();
  });

  describe('getClientForUser', () => {
    const { userId, exchangeName, apiKey, secretKey, extras } =
      generateExchangeApiKeysData();

    it('should get client via factory with correct params', async () => {
      mockExchangeApiKeysService.retrieve.mockResolvedValueOnce({
        id: faker.string.uuid(),
        apiKey,
        secretKey,
        extras,
        isValid: true,
        missingPermissions: [],
      });
      const mockClient = {} as ExchangeApiClient;
      mockExchangeApiClientFactory.create.mockReturnValue(mockClient);

      const client = await exchangesService.getClientForUser(
        userId,
        exchangeName,
      );

      expect(client).toBe(mockClient);

      expect(mockExchangeApiClientFactory.create).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiClientFactory.create).toHaveBeenCalledWith(
        exchangeName,
        {
          apiKey,
          secret: secretKey,
          extras,
          userId,
        },
      );
    });
  });

  describe('assertUserHasAuthorizedKeys', () => {
    const mockExchangeApiClient = createMock<ExchangeApiClient>();

    let userId: string;
    let exchangeName: string;
    let permissionsToCheck: ExchangePermission[];

    let spyOnGetClientForUser: jest.SpyInstance;

    beforeAll(() => {
      ({ userId, exchangeName } = generateExchangeApiKeysData());
      permissionsToCheck = faker.helpers.arrayElements(exchangePermissions);

      spyOnGetClientForUser = jest.spyOn(exchangesService, 'getClientForUser');
      spyOnGetClientForUser.mockImplementation(() => mockExchangeApiClient);
    });

    afterAll(() => {
      spyOnGetClientForUser.mockRestore();
    });

    it('should not throw if access check succeeded', async () => {
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: true,
      });

      await exchangesService.assertUserHasAuthorizedKeys(
        userId,
        exchangeName,
        permissionsToCheck,
      );

      expect(spyOnGetClientForUser).toHaveBeenCalledTimes(1);
      expect(spyOnGetClientForUser).toHaveBeenCalledWith(userId, exchangeName);

      expect(mockExchangeApiClient.checkRequiredAccess).toHaveBeenCalledTimes(
        1,
      );
      expect(mockExchangeApiClient.checkRequiredAccess).toHaveBeenCalledWith(
        permissionsToCheck,
      );
    });

    it('should throw KeyAuthorizationError if access check fails', async () => {
      const missingPermission = faker.helpers.arrayElement(permissionsToCheck);
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: false,
        missing: [missingPermission],
      });

      let thrownError;
      try {
        await exchangesService.assertUserHasAuthorizedKeys(
          userId,
          exchangeName,
          permissionsToCheck,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(KeyAuthorizationError);
      expect(thrownError.exchangeName).toBe(exchangeName);
      expect(thrownError.missingPermissions).toEqual([missingPermission]);
    });
  });

  describe('markApiKeyAsInvalid', () => {
    const mockExchangeApiClient = createMock<ExchangeApiClient>();

    let userId: string;
    let exchangeName: string;
    let missingPermissions: ExchangePermission[];
    let spyOnGetClientForUser: jest.SpyInstance;

    beforeAll(() => {
      ({ userId, exchangeName } = generateExchangeApiKeysData());
      missingPermissions = faker.helpers.arrayElements(exchangePermissions);

      spyOnGetClientForUser = jest.spyOn(exchangesService, 'getClientForUser');
      spyOnGetClientForUser.mockImplementation(() => mockExchangeApiClient);
    });

    afterAll(() => {
      spyOnGetClientForUser.mockRestore();
    });

    it('should mark key as invalid if access check fails', async () => {
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: false,
        missing: missingPermissions,
      });

      await exchangesService.revalidateApiKey(userId, exchangeName);

      expect(mockExchangeApiKeysService.markAsInvalid).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiKeysService.markAsInvalid).toHaveBeenCalledWith(
        userId,
        exchangeName,
        missingPermissions,
      );
    });

    it('should not mark key as invalid if access check fails', async () => {
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: true,
      });

      await exchangesService.revalidateApiKey(userId, exchangeName);

      expect(mockExchangeApiKeysService.markAsInvalid).toHaveBeenCalledTimes(0);
    });

    it('should not throw but log if operation fails', async () => {
      const syntheticError = new Error(faker.lorem.words());
      mockExchangeApiClient.checkRequiredAccess.mockRejectedValueOnce(
        syntheticError,
      );

      await exchangesService.revalidateApiKey(userId, exchangeName);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to revalidate exchange api key',
        {
          userId,
          exchangeName,
          error: syntheticError,
        },
      );
    });
  });
});
