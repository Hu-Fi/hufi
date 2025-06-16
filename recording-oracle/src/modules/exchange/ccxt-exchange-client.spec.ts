jest.mock('ccxt', () => {
  const actualCcxt = jest.requireActual<typeof import('ccxt')>('ccxt');

  const mockedCcxt = new Proxy<Record<string, unknown>>(
    {
      version: actualCcxt.version,
      exchanges: actualCcxt.exchanges,
      NetworkError: actualCcxt.NetworkError,
    },
    {
      get: (target, prop: string) => {
        if (!(prop in target)) {
          target[prop] = jest.fn();
        }

        return target[prop];
      },
    },
  );
  return mockedCcxt;
});
jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import * as ccxt from 'ccxt';
import type { Exchange } from 'ccxt';

import logger from '@/logger';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import { ExchangeApiClientError } from './errors';
import { generateExchangeName } from './fixtures';

const mockedCcxt = jest.mocked(ccxt);
const mockedExchange = createMock<Exchange>();

describe('CcxtExchangeClient', () => {
  describe('constructor', () => {
    let exchangeName: string;

    beforeEach(() => {
      exchangeName = generateExchangeName();
      mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should not create instance if exchange not supported', () => {
      const exchangeName = faker.lorem.word();
      let thrownError;
      try {
        new CcxtExchangeClient(exchangeName, {
          apiKey: faker.string.sample(),
          secret: faker.string.sample(),
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.constructor).toBe(Error);
      expect(thrownError.message).toBe(
        `Exchange not supported: ${exchangeName}`,
      );
    });

    it.each([true, false, undefined])(
      'should create instance with sandbox mode [%#]',
      (sandboxParam) => {
        const apiKey = faker.string.sample();
        const secret = faker.string.sample();

        new CcxtExchangeClient(exchangeName, {
          apiKey,
          secret,
          sandbox: sandboxParam,
        });

        expect(mockedCcxt[exchangeName]).toHaveBeenCalledTimes(1);
        expect(mockedCcxt[exchangeName]).toHaveBeenCalledWith({
          apiKey,
          secret,
        });

        const expectedSandboxMode = Boolean(sandboxParam);
        if (expectedSandboxMode) {
          expect(mockedExchange.setSandboxMode).toHaveBeenCalledTimes(1);
          expect(mockedExchange.setSandboxMode).toHaveBeenCalledWith(
            expectedSandboxMode,
          );
        } else {
          expect(mockedExchange.setSandboxMode).toHaveBeenCalledTimes(0);
        }
      },
    );
  });

  describe('instance methods', () => {
    let ccxtExchangeApiClient: CcxtExchangeClient;

    beforeAll(() => {
      const exchangeName = generateExchangeName();
      mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);

      ccxtExchangeApiClient = new CcxtExchangeClient(exchangeName, {
        apiKey: faker.string.sample(),
        secret: faker.string.sample(),
      });
    });

    it('should be defined', () => {
      expect(ccxtExchangeApiClient).toBeDefined();
    });

    describe('checkRequiredCredentials', () => {
      it('should properly call origin and return', () => {
        const expectedReturn = faker.datatype.boolean();
        mockedExchange.checkRequiredCredentials.mockReturnValueOnce(
          expectedReturn,
        );

        const result = ccxtExchangeApiClient.checkRequiredCredentials();

        expect(result).toBe(expectedReturn);
        expect(mockedExchange.checkRequiredCredentials).toHaveBeenCalledWith(
          false,
        );
      });
    });

    describe('checkRequiredAccess', () => {
      it('should throw in case of network error', async () => {
        const testError = new ccxt.NetworkError(faker.lorem.sentence());
        mockedExchange.fetchBalance.mockRejectedValueOnce(testError);

        let thrownError;
        try {
          await ccxtExchangeApiClient.checkRequiredAccess();
        } catch (error) {
          thrownError = error;
        }

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);

        const expectedMessage = 'Error while checking exchange access';
        expect(thrownError).toBeInstanceOf(ExchangeApiClientError);
        expect(thrownError.message).toBe(expectedMessage);
        expect(logger.error).toHaveBeenCalledWith(expectedMessage, testError);
      });

      it("should return false if can't fetch the balance", async () => {
        const syntheticAuthError = new Error(faker.lorem.sentence());
        mockedExchange.fetchBalance.mockRejectedValueOnce(syntheticAuthError);

        const result = await ccxtExchangeApiClient.checkRequiredAccess();

        expect(result).toBe(false);
        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);
      });

      it('should return true if can fetch the balance', async () => {
        mockedExchange.fetchBalance.mockResolvedValueOnce({});

        const result = await ccxtExchangeApiClient.checkRequiredAccess();

        expect(result).toBe(true);
        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);
      });
    });
  });
});
