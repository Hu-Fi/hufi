import { ChainId } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';

import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorWeb3 } from '../../common/constants/errors';
import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../../common/constants/networks';
import { Web3Env } from '../../common/enums/web3';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);

  private readonly signers = new Map<number, Wallet>();

  constructor(
    private readonly web3Config: Web3ConfigService,
    private readonly networkConfig: NetworkConfigService,
  ) {
    this.bootstrapSigners();
  }

  private bootstrapSigners(): void {
    const privateKey = this.web3Config.privateKey?.trim();
    if (!privateKey) {
      throw new ControlledError(
        ErrorWeb3.MissingPrivateKey,
        HttpStatus.BAD_REQUEST,
      );
    }

    const validChains = this.getValidChains();
    const networks = this.networkConfig.networks.filter((n) =>
      validChains.includes(n.chainId),
    );

    if (!networks.length) {
      throw new ControlledError(
        ErrorWeb3.NoValidNetworks,
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const n of networks) {
      try {
        const provider = new ethers.JsonRpcProvider(n.rpcUrl);
        const wallet = new Wallet(privateKey, provider);
        this.signers.set(n.chainId, wallet);
        this.logger.log(`Signer ready for chain ${n.chainId} (${n.rpcUrl})`);
      } catch (err: any) {
        this.logger.error(
          `Failed to create signer for chain ${n.chainId}: ${err.message}`,
        );
      }
    }
  }

  public getSigner(chainId: number): Wallet {
    this.validateChainId(chainId);
    const signer = this.signers.get(chainId);
    if (!signer) {
      throw new ControlledError(
        ErrorWeb3.SignerUnavailable,
        HttpStatus.NOT_FOUND,
      );
    }
    return signer;
  }

  public async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const feeData = await signer.provider.getFeeData();
    const base =
      feeData.gasPrice ?? feeData.maxFeePerGas ?? feeData.maxPriorityFeePerGas;

    if (base === null || base === undefined) {
      throw new ControlledError(ErrorWeb3.GasPriceError, HttpStatus.CONFLICT);
    }

    // Fixed‑point multiplier
    const multiplier = BigInt(
      Math.round(this.web3Config.gasPriceMultiplier * 10_000),
    );
    return (base * multiplier) / 10_000n;
  }

  /**
   * Return the operator’s address.
   * If `chainId` is supplied we return the signer for that chain.
   * Otherwise we return the first configured signer
   */
  public getOperatorAddress(chainId?: number): string {
    if (chainId !== undefined) {
      return this.getSigner(chainId).address;
    }

    const firstSigner = this.signers.values().next().value as
      | Wallet
      | undefined;
    if (!firstSigner) {
      throw new ControlledError(
        ErrorWeb3.NoValidNetworks,
        HttpStatus.BAD_REQUEST,
      );
    }
    return firstSigner.address;
  }

  public validateChainId(chainId: number): void {
    if (!this.getValidChains().includes(chainId)) {
      throw new ControlledError(
        ErrorWeb3.InvalidChainId,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public getValidChains(): ChainId[] {
    switch (this.web3Config.env) {
      case Web3Env.MAINNET:
        return MAINNET_CHAIN_IDS;
      case Web3Env.TESTNET:
        return TESTNET_CHAIN_IDS;
      case Web3Env.LOCALHOST:
      default:
        return LOCALHOST_CHAIN_IDS;
    }
  }
}
