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
  TOKENS,
} from '../../common/constants/networks';
import { Web3Env } from '../../common/enums/web3';
import { ControlledError } from '../../common/errors/controlled';

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
      this.logger.log(ErrorWeb3.NoValidNetworks, Web3Service.name);
      throw new ControlledError(
        ErrorWeb3.NoValidNetworks,
        HttpStatus.BAD_REQUEST,
      );
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
      this.logger.log(ErrorWeb3.InvalidChainId, Web3Service.name);
      throw new ControlledError(
        ErrorWeb3.InvalidChainId,
        HttpStatus.BAD_REQUEST,
      );
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
    const gasPrice = (await signer.provider?.getFeeData())?.gasPrice;
    if (gasPrice) {
      return (gasPrice * BigInt(Math.round(multiplier * 100))) / BigInt(100);
    }
    throw new ControlledError(ErrorWeb3.GasPriceError, HttpStatus.CONFLICT);
  }

  public getOperatorAddress(): string {
    return Object.values(this.signers)[0].address;
  }

  public async getTokenDecimals(
    tokenAddress: string,
    chainId: number,
  ): Promise<number> {
    const addr = tokenAddress.toLowerCase();

    if (TOKENS[`${addr}:${chainId}`]) {
      return TOKENS[`${addr}:${chainId}`].decimals;
    }

    try {
      const abi = ['function decimals() view returns (uint8)'];
      const provider = this.getSigner(chainId);
      const contract = new ethers.Contract(tokenAddress, abi, provider);
      const decimals = Number(await contract.decimals());
      return decimals;
    } catch (err) {
      this.logger.warn(
        `Could not fetch decimals for token ${addr}, defaulting to 18`,
      );
      return 18;
    }
  }

  public async getTokenSymbol(
    tokenAddress: string,
    chainId: number,
  ): Promise<string> {
    const addr = tokenAddress.toLowerCase();
    if (TOKENS[`${addr}:${chainId}`]) {
      return TOKENS[`${addr}:${chainId}`].symbol;
    }
    try {
      const provider = this.getSigner(chainId);
      const abi = ['function symbol() view returns (string)'];
      const contract = new ethers.Contract(tokenAddress, abi, provider);
      return await contract.symbol();
    } catch (err) {
      this.logger.warn(
        `Could not fetch symbol for token ${addr}, defaulting to HMT`,
      );
      return 'HMT';
    }
  }
}
