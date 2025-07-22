import { Injectable } from '@nestjs/common';
import { ethers, JsonRpcProvider } from 'ethers';

import {
  type ChainId,
  ChainIds,
  ERC20_ABI_DECIMALS,
  ERC20_ABI_SYMBOL,
} from '@/common/constants';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import type { Chain } from './types';

const operationPromisesCache = new Map<string, Promise<unknown>>();

@Injectable()
export class Web3Service {
  private readonly logger = logger.child({ context: Web3Service.name });

  private providersByChainId: {
    [chainId: number]: JsonRpcProvider;
  } = {};

  constructor(private readonly web3ConfigService: Web3ConfigService) {
    for (const chain of this.supportedChains) {
      this.providersByChainId[chain.id] = new ethers.JsonRpcProvider(
        chain.rpcUrl,
      );
    }
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

  get supportedChainIds(): ChainId[] {
    return this.supportedChains.map((v) => v.id);
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
}
