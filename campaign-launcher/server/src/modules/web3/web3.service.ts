import { Injectable } from '@nestjs/common';
import { Alchemy } from 'alchemy-sdk';
import { ethers, JsonRpcProvider } from 'ethers';
import { LRUCache } from 'lru-cache';

import {
  ChainIds,
  ERC20_ABI_DECIMALS,
  ERC20_ABI_SYMBOL,
} from '@/common/constants';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import type { Chain } from './types';

const operationPromisesCache = new Map<string, Promise<unknown>>();

const tokenPriceCache = new LRUCache<string, number>({
  ttl: 1000 * 60 * 1,
  max: 4200,
  ttlAutopurge: false,
  allowStale: false,
  noDeleteOnStaleGet: false,
  noUpdateTTL: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

const MISSING_TOKEN_PRICE = -1;

@Injectable()
export class Web3Service {
  private readonly logger = logger.child({ context: Web3Service.name });

  private providersByChainId: {
    [chainId: number]: JsonRpcProvider;
  } = {};

  private readonly alchemySdk: Alchemy;

  constructor(private readonly web3ConfigService: Web3ConfigService) {
    for (const chain of this.supportedChains) {
      this.providersByChainId[chain.id] = new ethers.JsonRpcProvider(
        chain.rpcUrl,
      );
    }

    this.alchemySdk = new Alchemy({
      apiKey: this.web3ConfigService.alchemyApiKey,
      maxRetries: 5,
    });
  }

  private get supportedChains(): Chain[] {
    const supportedChains: Chain[] = [];

    for (const chainId of ChainIds) {
      const rpcUrl = this.web3ConfigService.getRpcUrlByChainId(chainId);
      if (!rpcUrl) {
        continue;
      }

      supportedChains.push({
        id: chainId,
        rpcUrl,
      });
    }

    if (!supportedChains.length) {
      throw new Error('Supported chains not configured');
    }

    return supportedChains;
  }

  getProvider(chainId: number): JsonRpcProvider {
    const provider = this.providersByChainId[chainId];

    if (provider) {
      return provider;
    }

    throw new Error(`No rpc provider for provided chain id: ${chainId}`);
  }

  async getTokenDecimals(
    chainId: number,
    tokenAddress: string,
  ): Promise<number> {
    const cacheKey = `token-decimals-${chainId}-${tokenAddress}`;

    try {
      if (!operationPromisesCache.has(cacheKey)) {
        const provider = this.getProvider(chainId);

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI_DECIMALS,
          provider,
        );

        operationPromisesCache.set(cacheKey, tokenContract.decimals());
      }

      const operationPromise = operationPromisesCache.get(
        cacheKey,
      ) as Promise<bigint>;

      const decimals: bigint = await operationPromise;

      return Number(decimals);
    } catch (error) {
      operationPromisesCache.delete(cacheKey);

      const message = 'Failed to get token decimals';
      this.logger.error(message, {
        error,
        chainId,
        tokenAddress,
      });

      throw new Error(message);
    }
  }

  async getTokenSymbol(chainId: number, tokenAddress: string): Promise<string> {
    const cacheKey = `token-symbol-${chainId}-${tokenAddress}`;

    try {
      if (!operationPromisesCache.has(cacheKey)) {
        const provider = this.getProvider(chainId);

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI_SYMBOL,
          provider,
        );

        operationPromisesCache.set(cacheKey, tokenContract.symbol());
      }

      const symbol = await operationPromisesCache.get(cacheKey);
      return symbol as string;
    } catch (error) {
      operationPromisesCache.delete(cacheKey);

      const message = 'Failed to get token symbol';
      this.logger.error(message, {
        error,
        chainId,
        tokenAddress,
      });

      throw new Error(message);
    }
  }

  async getTokenPriceUsd(symbol: string): Promise<number | null> {
    const cacheKey = `get-token-price-usd-${symbol}`;
    try {
      let tokenPriceUsd = tokenPriceCache.get(cacheKey);

      if (tokenPriceUsd === undefined) {
        const {
          data: [apiResult],
        } = await this.alchemySdk.prices.getTokenPriceBySymbol([
          /**
           * Seems that Alchemy API is not case-sensitive to symbol,
           * but always use upper just in case.
           */
          symbol.toUpperCase(),
        ]);

        const priceUsd =
          apiResult.prices.find((price) => price.currency === 'usd')?.value ||
          null;

        if (priceUsd) {
          tokenPriceUsd = Number(priceUsd);
        } else {
          this.logger.warn('Token price in USD is not available', {
            symbol,
            apiResult,
          });
          tokenPriceUsd = MISSING_TOKEN_PRICE;
        }

        tokenPriceCache.set(cacheKey, tokenPriceUsd);
      }

      return tokenPriceUsd === MISSING_TOKEN_PRICE ? null : tokenPriceUsd;
    } catch (error) {
      this.logger.error('Error while getting token price', {
        symbol,
        error,
      });

      throw new Error('Failed to get token price');
    }
  }
}
