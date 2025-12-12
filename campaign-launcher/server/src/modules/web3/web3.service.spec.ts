jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Alchemy } from 'alchemy-sdk';
import { JsonRpcProvider } from 'ethers';

import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import { generateTestnetChainId, mockWeb3ConfigService } from './fixtures';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        Web3Service,
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  it('should succesfully create service instance', () => {
    /**
     * Constructor throws if configuration is invalid,
     * so check for an instance as litmus test
     */
    expect(web3Service).toBeDefined();
  });

  describe('getProvider', () => {
    it('should return provider for a valid chainId on testnet', () => {
      const validChainId = generateTestnetChainId();

      const provider = web3Service.getProvider(validChainId);
      expect(provider).toBeInstanceOf(JsonRpcProvider);
    });

    it('should throw if invalid chain id provided', () => {
      const invalidChainId = -42;

      expect(() => web3Service.getProvider(invalidChainId)).toThrow(
        `No rpc provider for provided chain id: ${invalidChainId}`,
      );
    });
  });

  describe('getTokenPriceUsd', () => {
    const testTokenSymbol = faker.finance.currencyCode();

    const mockTokenPriceCache = new Map();
    const mockAlchemySdk = {
      prices: createMock<Alchemy['prices']>(),
    };

    let replacedTokenPriceCacheRef: jest.ReplaceProperty<'tokenPriceCache'>;
    let replacedAlchemySdkRef: jest.ReplaceProperty<'alchemySdk'>;

    beforeAll(() => {
      replacedTokenPriceCacheRef = jest.replaceProperty(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        web3Service as any,
        'tokenPriceCache',
        mockTokenPriceCache,
      );
      replacedAlchemySdkRef = jest.replaceProperty(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        web3Service as any,
        'alchemySdk',
        mockAlchemySdk,
      );
    });

    afterAll(() => {
      replacedTokenPriceCacheRef.restore();
      replacedAlchemySdkRef.restore();
    });

    afterEach(() => {
      jest.resetAllMocks();

      mockTokenPriceCache.clear();
    });

    it('should log a warn if alchemy operation fails and throw', async () => {
      const testError = new Error(faker.lorem.sentence());

      mockAlchemySdk.prices.getTokenPriceBySymbol.mockRejectedValueOnce(
        testError,
      );

      let thrownError;
      try {
        await web3Service.getTokenPriceUsd(testTokenSymbol);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Failed to get token price');

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Failed to get token price', {
        symbol: testTokenSymbol,
        error: testError,
      });
    });

    it('should cache and return price if available', async () => {
      const price = faker.number.float();
      mockAlchemySdk.prices.getTokenPriceBySymbol.mockResolvedValueOnce({
        data: [
          {
            symbol: testTokenSymbol,
            prices: [
              {
                currency: 'usd',
                value: price.toString(),
                lastUpdatedAt: faker.date.recent().toISOString(),
              },
            ],
            error: null,
          },
        ],
      });

      /**
       * First call just to cache value
       */
      await web3Service.getTokenPriceUsd(testTokenSymbol);
      /**
       * Second call to retrieve cached
       */
      const result = await web3Service.getTokenPriceUsd(testTokenSymbol);

      expect(result).toBe(price);
      expect(mockAlchemySdk.prices.getTokenPriceBySymbol).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should not cache and return price if available for different symbols', async () => {
      const token1 = faker.finance.currencyCode();
      const price1 = faker.number.float();
      mockAlchemySdk.prices.getTokenPriceBySymbol.mockResolvedValueOnce({
        data: [
          {
            symbol: token1,
            prices: [
              {
                currency: 'usd',
                value: price1.toString(),
                lastUpdatedAt: faker.date.recent().toISOString(),
              },
            ],
            error: null,
          },
        ],
      });
      const token2 = `${token1}2`;
      const price2 = faker.number.float();
      mockAlchemySdk.prices.getTokenPriceBySymbol.mockResolvedValueOnce({
        data: [
          {
            symbol: token2,
            prices: [
              {
                currency: 'usd',
                value: price2.toString(),
                lastUpdatedAt: faker.date.recent().toISOString(),
              },
            ],
            error: null,
          },
        ],
      });

      const result1 = await web3Service.getTokenPriceUsd(token1);

      expect(result1).toBe(price1);
      expect(mockAlchemySdk.prices.getTokenPriceBySymbol).toHaveBeenCalledTimes(
        1,
      );

      const result2 = await web3Service.getTokenPriceUsd(token2);

      expect(result2).toBe(price2);
      expect(mockAlchemySdk.prices.getTokenPriceBySymbol).toHaveBeenCalledTimes(
        2,
      );
    });

    it.each([
      {
        data: [
          {
            symbol: testTokenSymbol,
            prices: [
              {
                currency: faker.string.sample(),
                value: faker.number.float().toString(),
                lastUpdatedAt: faker.date.recent().toISOString(),
              },
            ],
            error: null,
          },
        ],
      },
      {
        data: [
          {
            symbol: testTokenSymbol,
            prices: [],
            error: {
              message: 'Token not found',
            },
          },
        ],
      },
    ])(
      'should cache and return null if price is not available [%#]',
      async (apiResponse) => {
        mockAlchemySdk.prices.getTokenPriceBySymbol.mockResolvedValueOnce(
          apiResponse,
        );

        /**
         * First call just to cache value
         */
        await web3Service.getTokenPriceUsd(testTokenSymbol);
        /**
         * Second call to retrieve cached
         */
        const result = await web3Service.getTokenPriceUsd(testTokenSymbol);

        expect(result).toBe(null);
        expect(
          mockAlchemySdk.prices.getTokenPriceBySymbol,
        ).toHaveBeenCalledTimes(1);

        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(
          'Token price in USD is not available',
          {
            symbol: testTokenSymbol,
            apiResult: apiResponse.data[0],
          },
        );
      },
    );

    it.each(['usdt', 'usdt0', 'usdc'])(
      'should return 1 for %s w/o making alchemy call ',
      async (token) => {
        const result = await web3Service.getTokenPriceUsd(token);

        expect(result).toBe(1);
        expect(
          mockAlchemySdk.prices.getTokenPriceBySymbol,
        ).toHaveBeenCalledTimes(0);
      },
    );
  });
});
