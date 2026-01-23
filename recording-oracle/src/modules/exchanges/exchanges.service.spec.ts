jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangeNotSupportedError } from '@/common/errors/exchanges';
import { ExchangesConfigService } from '@/config';
import { UsersRepository } from '@/modules/users';
import { generateUserEntity } from '@/modules/users/fixtures';

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
import { generateExchangeName, mockExchangesConfigService } from './fixtures';

const mockExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();
const mockExchangeApiKeysService = createMock<ExchangeApiKeysService>();
const mockUsersRepository = createMock<UsersRepository>();

const exchangePermissions = Object.values(ExchangePermission);

describe('ExchangesService', () => {
  let exchangesService: ExchangesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangesService,
        {
          provide: ExchangesConfigService,
          useValue: mockExchangesConfigService,
        },
        {
          provide: ExchangeApiClientFactory,
          useValue: mockExchangeApiClientFactory,
        },
        {
          provide: ExchangeApiKeysService,
          useValue: mockExchangeApiKeysService,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    exchangesService = moduleRef.get<ExchangesService>(ExchangesService);
  });

  it('should be defined', () => {
    expect(exchangesService).toBeDefined();
  });

  describe('getClientForUser', () => {
    afterEach(() => {
      mockExchangesConfigService.configByExchange = {};
    });

    it('should throw if exchange is not supported', async () => {
      const userId = faker.string.uuid();
      const exchangeName = generateExchangeName();

      let thrownError;
      try {
        await exchangesService.getClientForUser(userId, exchangeName);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ExchangeNotSupportedError);
    });

    it('should get client via factory for CEX', async () => {
      const { userId, exchangeName, apiKey, secretKey, extras } =
        generateExchangeApiKeysData();
      mockExchangesConfigService.configByExchange = {
        [exchangeName]: {
          enabled: true,
          type: ExchangeType.CEX,
        },
      };

      mockExchangeApiKeysService.retrieve.mockResolvedValueOnce({
        id: faker.string.uuid(),
        apiKey,
        secretKey,
        extras,
        isValid: true,
        missingPermissions: [],
      });
      const mockClient = {} as ExchangeApiClient;
      mockExchangeApiClientFactory.createCex.mockReturnValue(mockClient);

      const client = await exchangesService.getClientForUser(
        userId,
        exchangeName,
      );

      expect(client).toBe(mockClient);

      expect(mockExchangeApiClientFactory.createCex).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiClientFactory.createCex).toHaveBeenCalledWith(
        exchangeName,
        {
          apiKey,
          secret: secretKey,
          extras,
          userId,
        },
      );
    });

    it('should get client via factory for DEX', async () => {
      const exchangeName = generateExchangeName();
      mockExchangesConfigService.configByExchange = {
        [exchangeName]: {
          enabled: true,
          type: ExchangeType.DEX,
        },
      };
      const user = generateUserEntity();

      mockUsersRepository.findOneById.mockResolvedValueOnce(user);
      const mockClient = {} as ExchangeApiClient;
      mockExchangeApiClientFactory.createDex.mockReturnValue(mockClient);

      const client = await exchangesService.getClientForUser(
        user.id,
        exchangeName,
      );

      expect(client).toBe(mockClient);

      expect(mockUsersRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(mockUsersRepository.findOneById).toHaveBeenCalledWith(user.id);

      expect(mockExchangeApiClientFactory.createDex).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiClientFactory.createDex).toHaveBeenCalledWith(
        exchangeName,
        {
          userId: user.id,
          userEvmAddress: user.evmAddress,
        },
      );
    });
  });

  describe('assertUserHasRequiredAccess', () => {
    const mockExchangeApiClient = createMock<ExchangeApiClient>();

    let userId: string;
    let exchangeName: ExchangeName;
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

    beforeEach(() => {
      mockExchangesConfigService.configByExchange[exchangeName] = {
        enabled: true,
        type: ExchangeType.CEX,
      };
    });

    it('should not check access for DEX', async () => {
      mockExchangesConfigService.configByExchange[exchangeName].type =
        ExchangeType.DEX;

      await exchangesService.assertUserHasRequiredAccess(
        userId,
        exchangeName,
        permissionsToCheck,
      );

      expect(spyOnGetClientForUser).toHaveBeenCalledTimes(0);
    });

    it('should not throw if access check succeeded', async () => {
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: true,
      });

      await exchangesService.assertUserHasRequiredAccess(
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

      expect(mockExchangeApiKeysService.markValidity).toHaveBeenCalledTimes(0);
    });

    it('should throw KeyAuthorizationError if access check fails', async () => {
      const missingPermissions = [
        faker.helpers.arrayElement(permissionsToCheck),
      ];
      mockExchangeApiClient.checkRequiredAccess.mockResolvedValueOnce({
        success: false,
        missing: missingPermissions,
      });

      let thrownError;
      try {
        await exchangesService.assertUserHasRequiredAccess(
          userId,
          exchangeName,
          permissionsToCheck,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(KeyAuthorizationError);
      expect(thrownError.exchangeName).toBe(exchangeName);
      expect(thrownError.missingPermissions).toEqual(missingPermissions);

      expect(mockExchangeApiKeysService.markValidity).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiKeysService.markValidity).toHaveBeenCalledWith(
        userId,
        exchangeName,
        missingPermissions,
      );
    });
  });
});
