import { ChainId } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ethers, Wallet } from 'ethers';

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

  public getExchangeOracle(): string {
    return this.web3ConfigService.exchangeOracle;
  }

  public getExchangeOracleFee(): number {
    return this.web3ConfigService.exchangeOracleFee;
  }

  public getRecordingOracle(): string {
    return this.web3ConfigService.recordingOracle;
  }

  public getRecordingOracleFee(): number {
    return this.web3ConfigService.recordingOracleFee;
  }

  public getReputationOracle(): string {
    return this.web3ConfigService.reputationOracle;
  }

  public getReputationOracleFee(): number {
    return this.web3ConfigService.reputationOracleFee;
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

  public async getTokenPriceUSD(
    tokenAddress: string,
    chainId: number,
  ): Promise<number> {
    const addr = tokenAddress.toLowerCase();

    if (addr === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f') {
      // USDT (Polygon) - fixed price
      return 1.0;
    }

    if (addr === '0xc748b2a084f8efc47e086ccddd9b7e67aeb571bf') {
      // HUMAN token - fetch using known CoinGecko ID
      try {
        const url =
          'https://api.coingecko.com/api/v3/simple/price?ids=human-protocol&vs_currencies=usd';
        const res = await axios.get(url);
        const price = res.data?.['human-protocol']?.usd;

        if (!price) throw new Error('Price not found for human-protocol');
        return price;
      } catch (error) {
        this.logger.warn(`Failed to fetch HUMAN token price: ${error.message}`);
        throw new ControlledError(
          'Failed to fetch HUMAN token price',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Fallback: generic CoinGecko query by contract address
    try {
      const platform = this.mapChainIdToCoingeckoPlatform(chainId);
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${addr}&vs_currencies=usd`;

      const res = await axios.get(url);
      const price = res.data?.[addr]?.usd;

      if (!price) throw new Error('Price not found for fallback address');
      return price;
    } catch (error) {
      this.logger.warn(
        `Generic CoinGecko token price failed: ${error.message}`,
      );
      throw new ControlledError(
        'Token price fetch failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  private mapChainIdToCoingeckoPlatform(chainId: number): string {
    switch (chainId) {
      case ChainId.MAINNET:
        return 'ethereum';
      case ChainId.POLYGON:
        return 'polygon-pos';
      case ChainId.BSC_MAINNET:
        return 'binance-smart-chain';
      default:
        throw new ControlledError(
          'Unsupported chain for price fetch',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  public async getTokenDecimals(
    tokenAddress: string,
    chainId: number,
  ): Promise<number> {
    const addr = tokenAddress.toLowerCase();

    // Hardcoded known tokens
    if (addr === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f') {
      return 6; // USDT (Polygon)
    }

    if (addr === '0xc748b2a084f8efc47e086ccddd9b7e67aeb571bf') {
      return 18; // HUMAN token
    }

    // Fallback: On-chain lookup for unknown tokens
    try {
      const abi = ['function decimals() view returns (uint8)'];
      const provider = this.getSigner(chainId).provider!;
      const contract = new ethers.Contract(tokenAddress, abi, provider);
      const decimals: number = await contract.decimals();
      return decimals;
    } catch (err) {
      this.logger.warn(
        `Could not fetch decimals for token ${addr}, defaulting to 18`,
      );
      return 18; // Reasonable fallback
    }
  }
}
