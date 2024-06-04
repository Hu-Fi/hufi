import { EscrowUtils, EscrowClient, ChainId } from '@human-protocol/sdk'; // Import EscrowUtils and SUPPORTED_CHAIN_IDS
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as ccxt from 'ccxt';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

import { Web3ConfigService } from '../../common/config/web3-config.service';
import { SUPPORTED_CHAIN_IDS } from '../../common/constants/chains';
import { Campaign } from '../../common/entities/campaign.entity';
import { User } from '../../common/entities/user.entity';
import { Manifest } from '../../common/interfaces/manifest';
import { EncryptionService } from '../../encryption/encryption.service';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';

import { LiquidityScoreCalculation } from './liquidity-score.model';
import { LiquidityDto } from './liquidity.dto';

interface CampaignWithManifest extends Manifest {
  escrowAddress: string;
}

@Injectable()
export class RecordsService {
  private logger = new Logger(RecordsService.name);
  private campaigns: Array<CampaignWithManifest> = [];

  constructor(
    private web3ConfigService: Web3ConfigService,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private storageService: StorageService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    private readonly httpService: HttpService,
  ) {}

  private getExchangeInstance(
    exchangeId: string,
    apiKey: string,
    secret: string,
  ): ccxt.Exchange {
    // eslint-disable-next-line import/namespace
    const exchangeClass = ccxt[exchangeId];
    if (!exchangeClass) {
      throw new Error(`Exchange ${exchangeId} not supported.`);
    }
    return new exchangeClass({ apiKey, secret });
  }

  private async fetchTrades(
    exchange: ccxt.Exchange,
    symbol: string,
    since: number,
  ): Promise<ccxt.Trade[]> {
    return exchange.fetchMyTrades(symbol, since);
  }

  private async fetchOpenOrders(
    exchange: ccxt.Exchange,
    symbol: string,
  ): Promise<ccxt.Order[]> {
    return exchange.fetchOpenOrders(symbol);
  }

  private async fetchOrderBook(
    exchange: ccxt.Exchange,
    symbol: string,
  ): Promise<ccxt.OrderBook> {
    return exchange.fetchOrderBook(symbol);
  }

  private calculateSpread(orderBook: ccxt.OrderBook): number {
    const bid = orderBook.bids.length ? orderBook.bids[0][0] : 0;
    const ask = orderBook.asks.length ? orderBook.asks[0][0] : 0;
    return bid && ask ? ask - bid : 0;
  }

  private async processOpenOrders(
    exchange: ccxt.Exchange,
    symbol: string,
  ): Promise<{
    openOrderVolume: number;
    averageDuration: number;
    spread: number;
  }> {
    const orders = await this.fetchOpenOrders(exchange, symbol);
    const orderBook = await this.fetchOrderBook(exchange, symbol);
    const spread = this.calculateSpread(orderBook);

    const now = Date.now();
    let totalDuration = 0;
    const openOrderVolume = orders.reduce((acc, order) => {
      const orderCreationTime = new Date(order.timestamp).getTime();
      const duration = (now - orderCreationTime) / 1000; // Convert duration from milliseconds to seconds
      totalDuration += duration;
      return acc + order.amount;
    }, 0);

    const averageDuration = orders.length ? totalDuration / orders.length : 0;

    return { openOrderVolume, averageDuration, spread };
  }

  async calculateLiquidityScore(
    apiKey: string,
    secret: string,
    exchangeId: string,
    symbol: string,
    since: number,
  ): Promise<number> {
    const exchange = this.getExchangeInstance(exchangeId, apiKey, secret);
    const trades = await this.fetchTrades(exchange, symbol, since);
    const tradeVolume = trades.reduce((acc, trade) => acc + trade.amount, 0);

    const { openOrderVolume, averageDuration, spread } =
      await this.processOpenOrders(exchange, symbol);

    const liquidityScoreCalculation = new LiquidityScoreCalculation(
      tradeVolume,
      openOrderVolume,
      averageDuration,
      spread,
    );

    return liquidityScoreCalculation.calculate();
  }

  @Cron(CronExpression.EVERY_HOUR) // Adjust the frequency as needed
  async calculateScoresForCampaigns(): Promise<void> {
    const chainId = SUPPORTED_CHAIN_IDS[0]; // or ChainId.ALL, based on your requirement
    await this.fetchCampaigns(chainId);

    for (const campaign of this.campaigns) {
      const liquidityDataForCampaign: LiquidityDto[] = [];

      const users = await this.userRepository.find({
        where: {
          campaigns: {
            address: campaign.escrowAddress,
          },
        },
        relations: ['campaigns'], // Make sure to load the campaigns relationship
      });

      for (const user of users) {
        const { apiKey, secret, exchange } = user;
        const decryptedApiKey = EncryptionService.decrypt(apiKey);
        const decryptedSecret = EncryptionService.decrypt(secret);

        const liquidityScore = await this.calculateLiquidityScore(
          decryptedApiKey,
          decryptedSecret,
          exchange,
          campaign.token,
          Date.now() - campaign.startBlock,
        );

        liquidityDataForCampaign.push({
          chainId: campaign.chainId,
          liquidityProvider: user.walletAddress,
          liquidityScore: liquidityScore.toString(),
        });
      }

      // Once all users are processed, push all scores at once
      if (liquidityDataForCampaign.length > 0) {
        await this.pushLiquidityScores(
          campaign.escrowAddress,
          campaign.chainId,
          liquidityDataForCampaign,
        );
      }
    }
  }

  async pushLiquidityScores(
    escrowAddress: string,
    chainId: ChainId,
    liquidityData: LiquidityDto[],
  ): Promise<string> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const saveLiquidityResult = await this.storageService.uploadLiquidities(
      escrowAddress,
      chainId,
      liquidityData,
    );

    await escrowClient.storeResults(
      escrowAddress,
      saveLiquidityResult.url,
      saveLiquidityResult.hash,
    );

    return 'Liquidity Scores for all users have been recorded.';
  }
  async fetchCampaigns(chainId: number): Promise<void> {
    try {
      const campaigns = await EscrowUtils.getEscrows({
        networks: chainId === ChainId.ALL ? SUPPORTED_CHAIN_IDS : [chainId],
        recordingOracle: this.web3ConfigService.recordingOracle,
      });

      const campaignsWithManifest: Array<CampaignWithManifest> =
        await Promise.all(
          campaigns.map(async (campaign) => {
            let manifest;

            try {
              const response = await lastValueFrom(
                this.httpService.get(campaign.manifestUrl),
              );
              manifest = response.data;
            } catch {
              manifest = undefined;
            }

            if (!manifest) {
              return undefined;
            }

            return {
              ...manifest,
              escrowAddress: campaign.address,
              chainId: campaign.chainId,
            } as CampaignWithManifest;
          }),
        );

      this.campaigns = campaignsWithManifest.filter(
        (campaign) => campaign !== undefined,
      );
    } catch (e: any) {
      this.logger.error('Error fetching campaigns:', e);
      throw new Error(e);
    }
  }
}
