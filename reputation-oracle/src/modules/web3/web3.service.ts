import { Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';

import { type ChainId, ChainIds, ERC20_ABI_DECIMALS } from '@/common/constants';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import type { Chain, WalletWithProvider } from './types';

const tokenDecimalsPromisesCache = new Map<string, Promise<number>>();

@Injectable()
export class Web3Service {
  private readonly logger = logger.child({
    context: Web3Service.name,
  });

  private signersByChainId: {
    [chainId: number]: WalletWithProvider;
  } = {};

  constructor(private readonly web3ConfigService: Web3ConfigService) {
    const privateKey = this.web3ConfigService.privateKey;

    for (const chain of this.supportedChains) {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      this.signersByChainId[chain.id] = new Wallet(
        privateKey,
        provider,
      ) as WalletWithProvider;
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
    const cacheKey = `${chainId}-${tokenAddress}`;

    try {
      if (!tokenDecimalsPromisesCache.has(cacheKey)) {
        const signer = this.getSigner(chainId);

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI_DECIMALS,
          signer,
        );

        tokenDecimalsPromisesCache.set(
          cacheKey,
          tokenContract.decimals() as Promise<number>,
        );
      }

      const decimals = await tokenDecimalsPromisesCache.get(cacheKey);
      return decimals as number;
    } catch (error) {
      tokenDecimalsPromisesCache.delete(cacheKey);

      const message = 'Failed to get token decimals';
      this.logger.error(message, {
        error,
        chainId,
        tokenAddress,
      });

      throw new Error(message);
    }
  }
}
