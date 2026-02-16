import { Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';

import { type ChainId, ChainIds, ERC20_ABI_DECIMALS } from '@/common/constants';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import type { Chain, TransactionFeeParams, WalletWithProvider } from './types';

const operationPromisesCache = new Map<string, Promise<unknown>>();

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

  async calculateTxFees(chainId: number): Promise<TransactionFeeParams> {
    const signer = this.getSigner(chainId);
    const feeData = await signer.provider.getFeeData();

    const multiplier = BigInt(this.web3ConfigService.gasPriceMultiplier);

    const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice;
    const maxPriorityFeePerGas =
      feeData.maxPriorityFeePerGas ?? feeData.gasPrice;

    if (maxFeePerGas && maxPriorityFeePerGas) {
      return {
        maxFeePerGas: maxFeePerGas * multiplier,
        maxPriorityFeePerGas: maxPriorityFeePerGas * multiplier,
      };
    }

    throw new Error(`No transaction fee data for chain id: ${chainId}`);
  }

  async getTokenDecimals(
    chainId: number,
    tokenAddress: string,
  ): Promise<number> {
    const cacheKey = `token-decimals-${chainId}-${tokenAddress}`;

    try {
      if (!operationPromisesCache.has(cacheKey)) {
        const signer = this.getSigner(chainId);

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI_DECIMALS,
          signer,
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
}
