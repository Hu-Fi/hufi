import { Injectable } from '@nestjs/common';
import { Alchemy } from 'alchemy-sdk';
import { Wallet, ethers } from 'ethers';
import { LRUCache } from 'lru-cache';

import {
  ChainIds,
  ERC20_ABI_DECIMALS,
  ERC20_ABI_SYMBOL,
} from '@/common/constants';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import type { Chain, WalletWithProvider } from './types';

const MISSING_TOKEN_PRICE = -1;

@Injectable()
export class Web3Service {
  private readonly logger = logger.child({ context: Web3Service.name });

  private signersByChainId: {
    [chainId: number]: WalletWithProvider;
  } = {};

  private readonly operationPromisesCache = new Map<string, Promise<unknown>>();

  private readonly alchemySdk: Alchemy;

  private readonly tokenPriceCache = new LRUCache<string, number>({
    ttl: 1000 * 60 * 1,
    max: 4200,
    ttlAutopurge: false,
    allowStale: false,
    noDeleteOnStaleGet: false,
    noUpdateTTL: false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
  });

  constructor(private readonly web3ConfigService: Web3ConfigService) {
    const privateKey = this.web3ConfigService.privateKey;

    for (const chain of this.supportedChains) {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      this.signersByChainId[chain.id] = new Wallet(
        privateKey,
        provider,
      ) as WalletWithProvider;
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

  getSigner(chainId: number): WalletWithProvider {
    const signer = this.signersByChainId[chainId];

    if (signer) {
      return signer;
    }

    throw new Error(`No signer for provided chain id: ${chainId}`);
  }

  async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const { gasPrice } = await signer.provider.getFeeData();

    if (gasPrice) {
      return gasPrice * BigInt(this.web3ConfigService.gasPriceMultiplier);
    }

    throw new Error(`No gas price data for chain id: ${chainId}`);
  }

  async getTokenDecimals(
    chainId: number,
    tokenAddress: string,
  ): Promise<number> {
    const cacheKey = `token-decimals-${chainId}-${tokenAddress}`;

    try {
      if (!this.operationPromisesCache.has(cacheKey)) {
        const provider = this.getSigner(chainId);

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI_DECIMALS,
          provider,
        );

        this.operationPromisesCache.set(cacheKey, tokenContract.decimals());
      }

      const operationPromise = this.operationPromisesCache.get(
        cacheKey,
      ) as Promise<bigint>;

      const decimals: bigint = await operationPromise;

      return Number(decimals);
    } catch (error) {
      this.operationPromisesCache.delete(cacheKey);

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
      if (!this.operationPromisesCache.has(cacheKey)) {
        const provider = this.getSigner(chainId);

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI_SYMBOL,
          provider,
        );

        this.operationPromisesCache.set(cacheKey, tokenContract.symbol());
      }

      const symbol = await this.operationPromisesCache.get(cacheKey);
      return symbol as string;
    } catch (error) {
      this.operationPromisesCache.delete(cacheKey);

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
    const uppercasedSymbol = symbol.toUpperCase();
    const cacheKey = `get-token-price-usd-${uppercasedSymbol}`;

    try {
      let tokenPriceUsd = this.tokenPriceCache.get(cacheKey);

      if (tokenPriceUsd === undefined) {
        const {
          data: [apiResult],
        } = await this.alchemySdk.prices.getTokenPriceBySymbol([
          /**
           * Seems that Alchemy API is not case-sensitive to symbol,
           * but always use upper just in case.
           */
          uppercasedSymbol,
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

        this.tokenPriceCache.set(cacheKey, tokenPriceUsd);
      }

      return tokenPriceUsd === MISSING_TOKEN_PRICE ? null : tokenPriceUsd;
    } catch (error) {
      const message = 'Failed to get token price';
      this.logger.error(message, {
        symbol,
        error,
      });

      throw new Error(message);
    }
  }
}
