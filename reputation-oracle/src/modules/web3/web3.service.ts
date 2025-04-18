import { ChainId } from '@human-protocol/sdk';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};
  public readonly logger = new Logger(Web3Service.name);

  constructor(
    private readonly web3ConfigService: Web3ConfigService,
    private readonly networkConfigService: NetworkConfigService,
  ) {
    const privateKey = this.web3ConfigService.privateKey;
    const validChains = this.getValidChains();
    const validNetworks = this.networkConfigService.networks.filter((network) =>
      validChains.includes(network.chainId),
    );

    if (!validNetworks.length) {
      this.logger.error(ErrorWeb3.NoValidNetworks);
      throw new BadRequestException(ErrorWeb3.NoValidNetworks);
    }

    for (const network of validNetworks) {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
  }

  public getSigner(chainId: number): Wallet {
    this.validateChainId(chainId);
    return this.signers[chainId];
  }

  public validateChainId(chainId: number): void {
    const validChainIds = this.getValidChains();
    if (!validChainIds.includes(chainId)) {
      this.logger.error(`${ErrorWeb3.InvalidChainId}: ${chainId}`);
      throw new BadRequestException(ErrorWeb3.InvalidChainId);
    }
  }

  public getValidChains(): ChainId[] {
    switch (this.web3ConfigService.env) {
      case Web3Env.MAINNET:
        return MAINNET_CHAIN_IDS;
      case Web3Env.TESTNET:
        return TESTNET_CHAIN_IDS;
      case Web3Env.LOCALHOST:
        return LOCALHOST_CHAIN_IDS;
      default:
        return LOCALHOST_CHAIN_IDS;
    }
  }

  public async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const multiplier = this.web3ConfigService.gasPriceMultiplier;

    try {
      const feeData = await signer.provider?.getFeeData();
      const gasPrice = feeData?.gasPrice;

      if (!gasPrice) throw new Error(ErrorWeb3.GasPriceError);

      return (gasPrice * BigInt(Math.round(multiplier * 100))) / BigInt(100);
    } catch (error) {
      this.logger.error(
        `Error fetching gas price for chain ${chainId}: ${error.message}`,
      );
      throw new Error(ErrorWeb3.GasPriceError);
    }
  }

  public getOperatorAddress(): string {
    return Object.values(this.signers)[0].address;
  }
}
