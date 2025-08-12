jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Alchemy } from 'alchemy-sdk';
import { FeeData, JsonRpcProvider, Provider } from 'ethers';

import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import { generateTestnetChainId, mockWeb3ConfigService } from './fixtures';
import type { WalletWithProvider } from './types';
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

  describe('getSigner', () => {
    it('should return correct signer for a valid chainId on testnet', () => {
      const validChainId = generateTestnetChainId();

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
      expect(signer.address).toEqual(mockWeb3ConfigService.operatorAddress);
      expect(signer.privateKey).toEqual(mockWeb3ConfigService.privateKey);
      expect(signer.provider).toBeInstanceOf(JsonRpcProvider);
    });

    it('should throw if invalid chain id provided', () => {
      const invalidChainId = -42;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(
        `No signer for provided chain id: ${invalidChainId}`,
      );
    });
  });

  describe('calculateGasPrice', () => {
    const mockProvider = createMock<Provider>();
    let spyOnGetSigner: jest.SpyInstance;

    beforeAll(() => {
      spyOnGetSigner = jest.spyOn(web3Service, 'getSigner').mockImplementation(
        () =>
          ({
            provider: mockProvider,
          }) as unknown as WalletWithProvider,
      );
    });

    afterAll(() => {
      spyOnGetSigner.mockRestore();
    });

    afterEach(() => {
      mockProvider.getFeeData.mockReset();
    });

    it('should use multiplier for gas price', async () => {
      const testChainId = generateTestnetChainId();

      const randomGasPrice = faker.number.bigInt({ min: 1n });

      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: randomGasPrice,
      } as FeeData);

      const gasPrice = await web3Service.calculateGasPrice(testChainId);

      const expectedGasPrice =
        randomGasPrice * BigInt(mockWeb3ConfigService.gasPriceMultiplier);
      expect(gasPrice).toEqual(expectedGasPrice);
    });

    it('should throw if no gas price from provider', async () => {
      const testChainId = generateTestnetChainId();

      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: null,
      } as FeeData);

      await expect(web3Service.calculateGasPrice(testChainId)).rejects.toThrow(
        `No gas price data for chain id: ${testChainId}`,
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
      expect(logger.error).toHaveBeenCalledWith(
        'Error while getting token price',
        {
          symbol: testTokenSymbol,
          error: testError,
        },
      );
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
      const token2 = faker.finance.currencyCode();
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
  });
});
