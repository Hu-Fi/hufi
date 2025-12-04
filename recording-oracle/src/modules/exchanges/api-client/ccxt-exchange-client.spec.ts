jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import * as ccxt from 'ccxt';
import type { Exchange } from 'ccxt';

import * as cryptoUtils from '@/common/utils/crypto';
import logger from '@/logger';
import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchanges/fixtures';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import { BASE_CCXT_CLIENT_OPTIONS } from './constants';
import { ExchangeApiAccessError, ExchangeApiClientError } from './errors';
import {
  generateAccountBalance,
  generateDepositAddressStructure,
  generateCcxtOpenOrder,
  generateCcxtTrade,
} from './fixtures';
import { ExchangePermission } from './types';

const mockedCcxt = jest.mocked(ccxt);
const mockedExchange = createMock<Exchange>();

const testCcxtApiAccessErrors = [
  ccxt.AccountNotEnabled,
  ccxt.AccountSuspended,
  ccxt.AuthenticationError,
  ccxt.BadSymbol,
  ccxt.PermissionDenied,
] as const;

const exchangePermissions = Object.values(ExchangePermission);

const EXPECTED_BASE_OPTIONS = Object.freeze({
  ...BASE_CCXT_CLIENT_OPTIONS,
});

describe('CcxtExchangeClient', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    let exchangeName: string;

    beforeEach(() => {
      exchangeName = generateExchangeName();
      mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);
    });

    it('should not create instance if exchange not supported', () => {
      const exchangeName = faker.lorem.slug();
      let thrownError;
      try {
        new CcxtExchangeClient(exchangeName, {
          apiKey: faker.string.sample(),
          secret: faker.string.sample(),
          userId: faker.string.uuid(),
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.constructor).toBe(Error);
      expect(thrownError.message).toBe(
        `Exchange not supported: ${exchangeName}`,
      );
    });

    it('should create instance with correct public values and logger context', () => {
      const spyOnLoggerChild = jest.spyOn(logger, 'child');

      try {
        const apiKey = faker.string.sample();
        const secret = faker.string.sample();
        const userId = faker.string.uuid();

        const ccxtExchangeClient = new CcxtExchangeClient(exchangeName, {
          apiKey,
          secret,
          userId,
        });

        expect(ccxtExchangeClient.exchangeName).toBe(exchangeName);
        expect(ccxtExchangeClient.userId).toBe(userId);

        expect(spyOnLoggerChild).toHaveBeenCalledTimes(1);
        expect(spyOnLoggerChild).toHaveBeenCalledWith({
          context: CcxtExchangeClient.name,
          exchangeName,
          userId,
          sandbox: expect.any(Boolean),
          apiKeyHash: cryptoUtils.hashString(apiKey, 'sha256'),
        });
      } finally {
        spyOnLoggerChild.mockRestore();
      }
    });

    it.each([true, false, undefined])(
      'should create instance with sandbox mode [%#]',
      (sandboxParam) => {
        const apiKey = faker.string.sample();
        const secret = faker.string.sample();
        const userId = faker.string.uuid();

        const ccxtExchangeClient = new CcxtExchangeClient(exchangeName, {
          apiKey,
          secret,
          userId,
          sandbox: sandboxParam,
        });

        const expectedSandboxMode = Boolean(sandboxParam);
        expect(ccxtExchangeClient.sandbox).toBe(expectedSandboxMode);
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

    it('should use base client options and avoid mutating them', () => {
      const apiKey = faker.string.sample();
      const secret = faker.string.sample();
      const userId = faker.string.uuid();
      const uid = faker.string.sample();

      new CcxtExchangeClient(exchangeName, {
        apiKey,
        secret,
        userId,
        extraCreds: {
          uid,
        },
      });

      expect(mockedCcxt[exchangeName]).toHaveBeenCalledTimes(1);
      expect(mockedCcxt[exchangeName]).toHaveBeenCalledWith({
        ...EXPECTED_BASE_OPTIONS,
        apiKey,
        secret,
        uid,
      });

      expect(BASE_CCXT_CLIENT_OPTIONS).toEqual(EXPECTED_BASE_OPTIONS);
    });
  });

  describe('instance methods', () => {
    /**
     * In some methods we rely on exact exchange name to adjust params,
     * so for general tests we don't mind, but will override where needed
     */
    const exchangeName = faker.lorem.slug();
    let ccxtExchangeApiClient: CcxtExchangeClient;

    beforeAll(() => {
      mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);

      ccxtExchangeApiClient = new CcxtExchangeClient(exchangeName, {
        apiKey: faker.string.sample(),
        secret: faker.string.sample(),
        userId: faker.string.uuid(),
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
          await ccxtExchangeApiClient.checkRequiredAccess(exchangePermissions);
        } catch (error) {
          thrownError = error;
        }

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(1);

        const expectedMessage = 'Error while checking exchange access';
        expect(thrownError).toBeInstanceOf(ExchangeApiClientError);
        expect(thrownError.message).toBe(expectedMessage);
        expect(thrownError.exchangeName).toBe(exchangeName);
        expect(logger.error).toHaveBeenCalledWith(expectedMessage, testError);
      });

      it('should re-throw unknown error', async () => {
        const testError = new Error(faker.lorem.sentence());
        mockedExchange.fetchDepositAddress.mockRejectedValueOnce(testError);

        let thrownError;
        try {
          await ccxtExchangeApiClient.checkRequiredAccess(exchangePermissions);
        } catch (error) {
          thrownError = error;
        }

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(1);

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe(testError.message);
      });

      it("should return false if can't fetch trades due to missing access", async () => {
        const now = Date.now();
        const syntheticAuthError = new ExchangeApiAccessError(
          exchangeName,
          ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
          faker.lorem.sentence(),
        );
        mockedExchange.fetchMyTrades.mockRejectedValueOnce(syntheticAuthError);

        jest.useFakeTimers({ now });

        const result = await ccxtExchangeApiClient.checkRequiredAccess([
          ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
        ]);

        jest.useRealTimers();

        expect(result).toEqual({
          success: false,
          missing: [ExchangePermission.VIEW_SPOT_TRADING_HISTORY],
        });

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(0);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(0);
        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(1);

        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledWith(
          'ETH/USDT',
          now,
        );
      });

      it("should return false if can't fetch the balance due to missing access", async () => {
        mockedExchange.fetchMyTrades.mockResolvedValueOnce([]);
        const syntheticAuthError = new ExchangeApiAccessError(
          exchangeName,
          ExchangePermission.VIEW_ACCOUNT_BALANCE,
          faker.lorem.sentence(),
        );
        mockedExchange.fetchBalance.mockRejectedValueOnce(syntheticAuthError);

        const result = await ccxtExchangeApiClient.checkRequiredAccess([
          ExchangePermission.VIEW_ACCOUNT_BALANCE,
        ]);

        expect(result).toEqual({
          success: false,
          missing: [ExchangePermission.VIEW_ACCOUNT_BALANCE],
        });

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(0);
        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(0);
      });

      it("should return false if can't fetch deposit address due to missing access", async () => {
        mockedExchange.fetchMyTrades.mockResolvedValueOnce([]);
        mockedExchange.fetchBalance.mockResolvedValueOnce(
          generateAccountBalance([faker.finance.currencyCode()]),
        );

        const syntheticAuthError = new ExchangeApiAccessError(
          exchangeName,
          ExchangePermission.VIEW_DEPOSIT_ADDRESS,
          faker.lorem.sentence(),
        );
        mockedExchange.fetchDepositAddress.mockRejectedValueOnce(
          syntheticAuthError,
        );

        const result = await ccxtExchangeApiClient.checkRequiredAccess([
          ExchangePermission.VIEW_DEPOSIT_ADDRESS,
        ]);

        expect(result).toEqual({
          success: false,
          missing: [ExchangePermission.VIEW_DEPOSIT_ADDRESS],
        });

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(0);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(0);

        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledWith(
          'ETH',
          {},
        );
      });

      it('should return true if has all necessary permissions', async () => {
        mockedExchange.fetchMyTrades.mockResolvedValueOnce([]);
        mockedExchange.fetchBalance.mockResolvedValueOnce(
          generateAccountBalance([faker.finance.currencyCode()]),
        );
        mockedExchange.fetchDepositAddress.mockResolvedValueOnce(
          generateDepositAddressStructure(),
        );

        const result =
          await ccxtExchangeApiClient.checkRequiredAccess(exchangePermissions);

        expect(result).toEqual({
          success: true,
        });

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(1);
      });
    });

    describe('fetchMyTrades', () => {
      let tradingPair: string;
      let tradesSince: Date;

      beforeEach(() => {
        tradingPair = generateTradingPair();
        tradesSince = faker.date.anytime();
      });

      it('should fetch trades with default limit and return mapped data', async () => {
        const nMockedResults = faker.number.int({ min: 2, max: 5 });
        const mockedTrade = generateCcxtTrade({ symbol: tradingPair });

        mockedExchange.fetchMyTrades.mockResolvedValueOnce(
          Array.from({ length: nMockedResults }, (_e, index) => ({
            ...mockedTrade,
            id: index.toString(),
          })),
        );

        const trades = await ccxtExchangeApiClient.fetchMyTrades(
          tradingPair,
          tradesSince.valueOf(),
        );

        expect(trades.length).toBe(nMockedResults);
        for (const [index, trade] of trades.entries()) {
          expect(trade).toEqual({
            ...mockedTrade,
            id: index.toString(),
            order: undefined,
            info: undefined,
            etc: undefined,
          });
        }

        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchMyTrades).toHaveBeenCalledWith(
          tradingPair,
          tradesSince.valueOf(),
        );
      });

      it('should throw ExchangeApiAccessError if no necessary access', async () => {
        const ErrorConstructor = faker.helpers.arrayElement(
          testCcxtApiAccessErrors,
        );
        const testError = new ErrorConstructor(faker.lorem.sentence());
        mockedExchange.fetchMyTrades.mockRejectedValueOnce(testError);

        let thrownError;
        try {
          await ccxtExchangeApiClient.fetchMyTrades(
            tradingPair,
            tradesSince.valueOf(),
          );
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
        expect(thrownError.message).toBe('Failed to access exchange API');
        expect(thrownError.permission).toBe(
          ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
        );
        expect(thrownError.cause).toBe(testError.message);
      });

      describe('handles exchange specific access errors', () => {
        describe('mexc', () => {
          let mexcClient: CcxtExchangeClient;

          beforeAll(() => {
            const exchangeName = 'mexc';
            mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);

            mexcClient = new CcxtExchangeClient(exchangeName, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });
          });

          it.each([
            'mexc {"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Invalid access key"}',
          ])(
            'should throw ExchangeApiAccessError when invalid api key [%#]',
            async (errorMessage) => {
              mockedExchange.fetchMyTrades.mockRejectedValueOnce(
                new Error(errorMessage),
              );

              let thrownError;
              try {
                await mexcClient.fetchMyTrades(
                  tradingPair,
                  tradesSince.valueOf(),
                );
              } catch (error) {
                thrownError = error;
              }

              expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
              expect(thrownError.message).toBe('Failed to access exchange API');
              expect(thrownError.permission).toBe(
                ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
              );
              expect(thrownError.cause).toBe(errorMessage);
            },
          );

          it('should re-throw original error when 10072 code not for mexc', async () => {
            const randomExchange = faker.lorem.slug();
            mockedCcxt[randomExchange].mockReturnValueOnce(mockedExchange);

            const exchangeClient = new CcxtExchangeClient(randomExchange, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });

            const nonMexcError = new Error(
              `${randomExchange} {"code":10072,"msg":"Another exchange error"}`,
            );
            mockedExchange.fetchMyTrades.mockRejectedValueOnce(nonMexcError);

            let thrownError;
            try {
              await exchangeClient.fetchMyTrades(
                tradingPair,
                tradesSince.valueOf(),
              );
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBe(nonMexcError);
          });
        });
      });
    });

    describe('fetchOpenOrders', () => {
      let tradingPair: string;
      let ordersSince: Date;

      beforeEach(() => {
        tradingPair = generateTradingPair();
        ordersSince = faker.date.anytime();
      });

      it('should fetch open orders with default limit and return mapped data', async () => {
        const nMockedResults = faker.number.int({ min: 2, max: 5 });
        const mockedOrder = generateCcxtOpenOrder({ symbol: tradingPair });

        mockedExchange.fetchOpenOrders.mockResolvedValueOnce(
          Array.from({ length: nMockedResults }, (_e, index) => ({
            ...mockedOrder,
            id: index.toString(),
          })),
        );

        const trades = await ccxtExchangeApiClient.fetchOpenOrders(
          tradingPair,
          ordersSince.valueOf(),
        );

        expect(trades.length).toBe(nMockedResults);
        for (const [index, trade] of trades.entries()) {
          expect(trade).toEqual({
            ...mockedOrder,
            id: index.toString(),
            info: undefined,
            etc: undefined,
            trades: undefined,
          });
        }

        expect(mockedExchange.fetchOpenOrders).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchOpenOrders).toHaveBeenCalledWith(
          tradingPair,
          ordersSince.valueOf(),
        );
      });

      it('should throw ExchangeApiAccessError if no necessary access', async () => {
        const ErrorConstructor = faker.helpers.arrayElement(
          testCcxtApiAccessErrors,
        );
        const testError = new ErrorConstructor(faker.lorem.sentence());
        mockedExchange.fetchOpenOrders.mockRejectedValueOnce(testError);

        let thrownError;
        try {
          await ccxtExchangeApiClient.fetchOpenOrders(
            tradingPair,
            ordersSince.valueOf(),
          );
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
        expect(thrownError.message).toBe('Failed to access exchange API');
        expect(thrownError.permission).toBe(
          ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
        );
        expect(thrownError.cause).toBe(testError.message);
      });

      describe('handles exchange specific access errors', () => {
        describe('mexc', () => {
          let mexcClient: CcxtExchangeClient;

          beforeAll(() => {
            const exchangeName = 'mexc';
            mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);

            mexcClient = new CcxtExchangeClient(exchangeName, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });
          });

          it.each([
            'mexc {"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Invalid access key"}',
          ])(
            'should throw ExchangeApiAccessError when invalid api key [%#]',
            async (errorMessage) => {
              mockedExchange.fetchOpenOrders.mockRejectedValueOnce(
                new Error(errorMessage),
              );

              let thrownError;
              try {
                await mexcClient.fetchOpenOrders(
                  tradingPair,
                  ordersSince.valueOf(),
                );
              } catch (error) {
                thrownError = error;
              }

              expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
              expect(thrownError.message).toBe('Failed to access exchange API');
              expect(thrownError.permission).toBe(
                ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
              );
              expect(thrownError.cause).toBe(errorMessage);
            },
          );

          it('should re-throw original error when 10072 code not for mexc', async () => {
            const randomExchange = faker.lorem.slug();
            mockedCcxt[randomExchange].mockReturnValueOnce(mockedExchange);

            const exchangeClient = new CcxtExchangeClient(randomExchange, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });

            const nonMexcError = new Error(
              `${randomExchange} {"code":10072,"msg":"Another exchange error"}`,
            );
            mockedExchange.fetchOpenOrders.mockRejectedValueOnce(nonMexcError);

            let thrownError;
            try {
              await exchangeClient.fetchOpenOrders(
                tradingPair,
                ordersSince.valueOf(),
              );
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBe(nonMexcError);
          });
        });
      });
    });

    describe('fetchBalance', () => {
      it('should fetch account balance and return it as is', async () => {
        const tokenSymbol = faker.finance.currencyCode();
        const mockedBalance = generateAccountBalance([tokenSymbol]);

        mockedExchange.fetchBalance.mockResolvedValueOnce(mockedBalance);

        const balance = await ccxtExchangeApiClient.fetchBalance();

        expect(balance).toEqual(mockedBalance);

        expect(mockedExchange.fetchBalance).toHaveBeenCalledTimes(1);
      });

      it('should throw ExchangeApiAccessError if no necessary access', async () => {
        const ErrorConstructor = faker.helpers.arrayElement(
          testCcxtApiAccessErrors,
        );
        const testError = new ErrorConstructor(faker.lorem.sentence());
        mockedExchange.fetchBalance.mockRejectedValueOnce(testError);

        let thrownError;
        try {
          await ccxtExchangeApiClient.fetchBalance();
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
        expect(thrownError.message).toBe('Failed to access exchange API');
        expect(thrownError.permission).toBe(
          ExchangePermission.VIEW_ACCOUNT_BALANCE,
        );
        expect(thrownError.cause).toBe(testError.message);
      });

      describe('handles exchange specific access errors', () => {
        describe('mexc', () => {
          let mexcClient: CcxtExchangeClient;

          beforeAll(() => {
            const exchangeName = 'mexc';
            mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);

            mexcClient = new CcxtExchangeClient(exchangeName, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });
          });

          it.each([
            'mexc {"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Invalid access key"}',
          ])(
            'should throw ExchangeApiAccessError when invalid api key [%#]',
            async (errorMessage) => {
              mockedExchange.fetchBalance.mockRejectedValueOnce(
                new Error(errorMessage),
              );

              let thrownError;
              try {
                await mexcClient.fetchBalance();
              } catch (error) {
                thrownError = error;
              }

              expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
              expect(thrownError.message).toBe('Failed to access exchange API');
              expect(thrownError.permission).toBe(
                ExchangePermission.VIEW_ACCOUNT_BALANCE,
              );
              expect(thrownError.cause).toBe(errorMessage);
            },
          );

          it('should re-throw original error when 10072 code not for mexc', async () => {
            const randomExchange = faker.lorem.slug();
            mockedCcxt[randomExchange].mockReturnValueOnce(mockedExchange);

            const exchangeClient = new CcxtExchangeClient(randomExchange, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });

            const nonMexcError = new Error(
              `${randomExchange} {"code":10072,"msg":"Another exchange error"}`,
            );
            mockedExchange.fetchBalance.mockRejectedValueOnce(nonMexcError);

            let thrownError;
            try {
              await exchangeClient.fetchBalance();
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBe(nonMexcError);
          });
        });
      });
    });

    describe('fetchDepositAddress', () => {
      it('should fetch deposit address info and return just address', async () => {
        const mockedAddressStructure = generateDepositAddressStructure();

        mockedExchange.fetchDepositAddress.mockResolvedValueOnce(
          mockedAddressStructure,
        );

        const address = await ccxtExchangeApiClient.fetchDepositAddress(
          mockedAddressStructure.currency,
        );

        expect(address).toEqual(mockedAddressStructure.address);

        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledWith(
          mockedAddressStructure.currency,
          {},
        );
      });

      it('should throw ExchangeApiAccessError if no necessary access', async () => {
        const ErrorConstructor = faker.helpers.arrayElement(
          testCcxtApiAccessErrors,
        );
        const testError = new ErrorConstructor(faker.lorem.sentence());
        mockedExchange.fetchDepositAddress.mockRejectedValueOnce(testError);

        let thrownError;
        try {
          await ccxtExchangeApiClient.fetchDepositAddress(
            faker.finance.currencyCode(),
          );
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
        expect(thrownError.message).toBe('Failed to access exchange API');
        expect(thrownError.permission).toBe(
          ExchangePermission.VIEW_DEPOSIT_ADDRESS,
        );
        expect(thrownError.cause).toBe(testError.message);
      });

      describe('handles exchange specific access errors', () => {
        describe('mexc', () => {
          let mexcClient: CcxtExchangeClient;

          beforeAll(() => {
            const exchangeName = 'mexc';
            mockedCcxt[exchangeName].mockReturnValueOnce(mockedExchange);

            mexcClient = new CcxtExchangeClient(exchangeName, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });
          });

          it.each([
            'mexc {"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Api key info invalid"}',
            '{"code":10072,"msg":"Invalid access key"}',
          ])(
            'should throw ExchangeApiAccessError when invalid api key [%#]',
            async (errorMessage) => {
              mockedExchange.fetchDepositAddress.mockRejectedValueOnce(
                new Error(errorMessage),
              );

              let thrownError;
              try {
                await mexcClient.fetchDepositAddress(
                  faker.finance.currencyCode(),
                );
              } catch (error) {
                thrownError = error;
              }

              expect(thrownError).toBeInstanceOf(ExchangeApiAccessError);
              expect(thrownError.message).toBe('Failed to access exchange API');
              expect(thrownError.permission).toBe(
                ExchangePermission.VIEW_DEPOSIT_ADDRESS,
              );
              expect(thrownError.cause).toBe(errorMessage);
            },
          );

          it('should re-throw original error when 10072 code not for mexc', async () => {
            const randomExchange = faker.lorem.slug();
            mockedCcxt[randomExchange].mockReturnValueOnce(mockedExchange);

            const exchangeClient = new CcxtExchangeClient(randomExchange, {
              apiKey: faker.string.sample(),
              secret: faker.string.sample(),
              userId: faker.string.uuid(),
            });

            const nonMexcError = new Error(
              `${randomExchange} {"code":10072,"msg":"Another exchange error"}`,
            );
            mockedExchange.fetchDepositAddress.mockRejectedValueOnce(
              nonMexcError,
            );

            let thrownError;
            try {
              await exchangeClient.fetchDepositAddress(
                faker.finance.currencyCode(),
              );
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBe(nonMexcError);
          });
        });
      });

      it('should fetch deposit address info for ERC20 network on gate', async () => {
        const GATE_EXCHANGE_NAME = 'gate';
        mockedCcxt[GATE_EXCHANGE_NAME].mockReturnValueOnce(mockedExchange);

        const mockedAddressStructure = generateDepositAddressStructure();
        mockedExchange.fetchDepositAddress.mockResolvedValueOnce(
          mockedAddressStructure,
        );

        ccxtExchangeApiClient = new CcxtExchangeClient(GATE_EXCHANGE_NAME, {
          apiKey: faker.string.sample(),
          secret: faker.string.sample(),
          userId: faker.string.uuid(),
        });

        const address = await ccxtExchangeApiClient.fetchDepositAddress(
          mockedAddressStructure.currency,
        );

        expect(address).toEqual(mockedAddressStructure.address);

        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledWith(
          mockedAddressStructure.currency,
          {
            network: 'ERC20',
          },
        );
      });

      it('should fetch deposit address info for ETH network on xt', async () => {
        const XT_EXCHANGE_NAME = 'xt';
        mockedCcxt[XT_EXCHANGE_NAME].mockReturnValueOnce(mockedExchange);

        const mockedAddressStructure = generateDepositAddressStructure();
        mockedExchange.fetchDepositAddress.mockResolvedValueOnce(
          mockedAddressStructure,
        );

        ccxtExchangeApiClient = new CcxtExchangeClient(XT_EXCHANGE_NAME, {
          apiKey: faker.string.sample(),
          secret: faker.string.sample(),
          userId: faker.string.uuid(),
        });

        const address = await ccxtExchangeApiClient.fetchDepositAddress(
          mockedAddressStructure.currency,
        );

        expect(address).toEqual(mockedAddressStructure.address);

        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledTimes(1);
        expect(mockedExchange.fetchDepositAddress).toHaveBeenCalledWith(
          mockedAddressStructure.currency,
          {
            network: 'ETH',
          },
        );
      });
    });
  });
});
