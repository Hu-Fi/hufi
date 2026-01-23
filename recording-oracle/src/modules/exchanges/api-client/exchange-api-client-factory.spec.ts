jest.mock('./ccxt-exchange-client');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import * as ccxt from 'ccxt';
import type { Exchange } from 'ccxt';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangesConfigService, LoggingConfigService } from '@/config';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import { BASE_CCXT_CLIENT_OPTIONS } from './constants';
import { IncompleteKeySuppliedError } from './errors';
import { ExchangeApiClientFactory } from './exchange-api-client-factory';
import { generateExchangeName, mockExchangesConfigService } from '../fixtures';

const mockedCcxt = jest.mocked(ccxt);
const mockedExchange = createMock<Exchange>();

const EXPECTED_BASE_OPTIONS = Object.freeze({
  ...BASE_CCXT_CLIENT_OPTIONS,
});

const mockedCcxtExchangeClient = jest.mocked(CcxtExchangeClient);

const mockLoggerConfigService: Pick<
  LoggingConfigService,
  'logExchangePermissionErrors'
> = {
  logExchangePermissionErrors: false,
};

describe('ExchangeApiClientFactory', () => {
  let exchangeApiClientFactory: ExchangeApiClientFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangeApiClientFactory,
        {
          provide: ExchangesConfigService,
          useValue: mockExchangesConfigService,
        },
        {
          provide: LoggingConfigService,
          useValue: mockLoggerConfigService,
        },
      ],
    }).compile();

    exchangeApiClientFactory = moduleRef.get<ExchangeApiClientFactory>(
      ExchangeApiClientFactory,
    );
  });

  it('should be defined', () => {
    expect(exchangeApiClientFactory).toBeDefined();
  });

  describe('module init', () => {
    let spyOnPreloadCcxtClient: jest.SpyInstance;

    beforeAll(() => {
      spyOnPreloadCcxtClient = jest.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exchangeApiClientFactory as any,
        'preloadCcxtClient',
      );
      spyOnPreloadCcxtClient.mockImplementation();
    });

    afterAll(() => {
      spyOnPreloadCcxtClient.mockRestore();
    });

    afterEach(async () => {
      mockExchangesConfigService.configByExchange = {};
      exchangeApiClientFactory['preloadedCcxtClients'].clear();
      await exchangeApiClientFactory.onModuleDestroy();
    });

    it('should init and preload ccxt client for enabled CEX', async () => {
      const exchangeName = generateExchangeName();
      mockExchangesConfigService.configByExchange = {
        [exchangeName]: {
          enabled: true,
          type: ExchangeType.CEX,
        },
      };

      await exchangeApiClientFactory.onModuleInit();

      expect(spyOnPreloadCcxtClient).toHaveBeenCalledTimes(1);
      expect(spyOnPreloadCcxtClient).toHaveBeenCalledWith(exchangeName);
    });

    it('should init and skip ccxt client preloading for disabled CEX', async () => {
      const exchangeName = generateExchangeName();
      mockExchangesConfigService.configByExchange = {
        [exchangeName]: {
          enabled: false,
          type: ExchangeType.CEX,
        },
      };

      await exchangeApiClientFactory.onModuleInit();

      expect(spyOnPreloadCcxtClient).toHaveBeenCalledTimes(0);
    });

    it('should init and skip ccxt client preloading for enabled DEX', async () => {
      const exchangeName = generateExchangeName();
      mockExchangesConfigService.configByExchange = {
        [exchangeName]: {
          enabled: true,
          type: ExchangeType.DEX,
        },
      };

      await exchangeApiClientFactory.onModuleInit();

      expect(spyOnPreloadCcxtClient).toHaveBeenCalledTimes(0);
    });
  });

  describe('preloadCcxtClient', () => {
    const exchangeName = faker.lorem.slug();

    beforeEach(() => {
      mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);
    });

    afterAll(() => {
      exchangeApiClientFactory['preloadedCcxtClients'].clear();
    });

    it('should correctly create new client instance and load markets', async () => {
      await exchangeApiClientFactory['preloadCcxtClient'](exchangeName);

      expect(mockedCcxt[exchangeName]).toHaveBeenCalledTimes(1);
      expect(mockedCcxt[exchangeName]).toHaveBeenCalledWith(
        EXPECTED_BASE_OPTIONS,
      );

      expect(mockedExchange.loadMarkets).toHaveBeenCalledTimes(1);
      expect(
        exchangeApiClientFactory['preloadedCcxtClients'].get(exchangeName),
      ).toBe(mockedExchange);

      expect(BASE_CCXT_CLIENT_OPTIONS).toEqual(EXPECTED_BASE_OPTIONS);
    });

    it('should use cached client instance to re-load markets', async () => {
      await exchangeApiClientFactory['preloadCcxtClient'](exchangeName);

      expect(mockedCcxt[exchangeName]).toHaveBeenCalledTimes(0);
      expect(mockedExchange.loadMarkets).toHaveBeenCalledTimes(1);
    });
  });

  describe('createCex', () => {
    let exchangeName: ExchangeName;
    let userId: string;
    let apiKey: string;
    let secret: string;

    beforeAll(() => {
      mockExchangesConfigService.configByExchange = new Proxy(
        {},
        {
          get() {
            return {
              enabled: true,
              type: ExchangeType.CEX,
            };
          },
        },
      );
    });

    afterAll(() => {
      mockExchangesConfigService.configByExchange = {};
    });

    beforeEach(() => {
      exchangeName = faker.lorem.slug() as ExchangeName;
      apiKey = faker.string.sample();
      secret = faker.string.sample();
      userId = faker.string.uuid();
    });

    it('should throw IncompleteKeySuppliedError if creds check fails', () => {
      mockedCcxtExchangeClient.prototype.checkRequiredCredentials.mockReturnValueOnce(
        false,
      );

      let thrownError;
      try {
        exchangeApiClientFactory.createCex(exchangeName, {
          apiKey,
          secret,
          userId,
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(IncompleteKeySuppliedError);
      expect(thrownError.exchangeName).toBe(exchangeName);
    });

    it('should return client instance if creds check succeeded', () => {
      mockedCcxtExchangeClient.prototype.checkRequiredCredentials.mockReturnValueOnce(
        true,
      );

      const client = exchangeApiClientFactory.createCex(exchangeName, {
        apiKey,
        secret,
        userId,
      });

      expect(client).toBeDefined();
      expect(mockedCcxtExchangeClient.mock.instances[0]).toBe(client);
    });

    it('should correctly init client for any exchange', () => {
      mockedCcxtExchangeClient.prototype.checkRequiredCredentials.mockReturnValueOnce(
        true,
      );

      const client = exchangeApiClientFactory.createCex(exchangeName, {
        apiKey,
        secret,
        userId,
      });

      expect(client).toBeDefined();

      expect(mockedCcxtExchangeClient).toHaveBeenCalledTimes(1);
      expect(mockedCcxtExchangeClient).toHaveBeenCalledWith(exchangeName, {
        apiKey,
        secret,
        userId,
        sandbox: mockExchangesConfigService.useSandbox,
        loggingConfig: {
          logPermissionErrors:
            mockLoggerConfigService.logExchangePermissionErrors,
        },
      });
    });

    it('should correctly init client for bitmart', () => {
      mockedCcxtExchangeClient.prototype.checkRequiredCredentials.mockReturnValueOnce(
        true,
      );
      const apiKeyMemo = faker.lorem.word();

      const client = exchangeApiClientFactory.createCex(ExchangeName.BITMART, {
        apiKey,
        secret,
        userId,
        extras: {
          apiKeyMemo,
        },
      });

      expect(client).toBeDefined();

      expect(mockedCcxtExchangeClient).toHaveBeenCalledTimes(1);
      expect(mockedCcxtExchangeClient).toHaveBeenCalledWith(
        ExchangeName.BITMART,
        expect.objectContaining({
          apiKey,
          secret,
          userId,
          extraCreds: {
            uid: apiKeyMemo,
          },
        }),
      );
    });

    it('should use preloaded client', async () => {
      const _mockedExchange = createMock<Exchange>();
      mockedCcxt[exchangeName].mockReturnValueOnce(_mockedExchange);
      await exchangeApiClientFactory['preloadCcxtClient'](exchangeName);

      mockedCcxtExchangeClient.prototype.checkRequiredCredentials.mockReturnValueOnce(
        true,
      );

      const client = exchangeApiClientFactory.createCex(exchangeName, {
        apiKey,
        secret,
        userId,
      });

      expect(client).toBeDefined();

      expect(mockedCcxtExchangeClient).toHaveBeenCalledTimes(1);

      const [exchangeNameParam, optionsParam] =
        mockedCcxtExchangeClient.mock.calls[0];

      expect(exchangeNameParam).toBe(exchangeName);
      expect(optionsParam.preloadedExchangeClient).toBe(_mockedExchange);

      exchangeApiClientFactory['preloadedCcxtClients'].clear();
    });
  });
});
