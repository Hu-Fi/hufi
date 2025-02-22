import { Encryption, UploadFile } from '@human-protocol/sdk';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';

import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorCampaign } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { LiquidityScore } from '../../common/types/liquidity-score';
import { isCenteralizedExchange } from '../../common/utils/exchange';
import {
  CampaignEntity,
  LiquidityScoreEntity,
  UserEntity,
} from '../../database/entities';
import { CampaignService } from '../campaign/campaign.service';
import { CCXTService } from '../exchange/ccxt.service';
import { UniswapService } from '../exchange/uniswap.service';
import { RecordsService } from '../records/records.service';
import { ExchangeAPIKeyRepository } from '../user/exchange-api-key.repository';

import { LiquidityScoreCalculateRequestDto } from './liquidity-score.dto';
import { LiquidityScoreRepository } from './liquidity-score.repository';

@Injectable()
export class LiquidityScoreService {
  private logger: Logger = new Logger(LiquidityScoreService.name);

  constructor(
    @Inject(CampaignService)
    private campaignService: CampaignService,
    @Inject(PGPConfigService)
    private pgpConfigService: PGPConfigService,
    @InjectRepository(ExchangeAPIKeyRepository)
    private exchangeAPIKeyRepository: ExchangeAPIKeyRepository,
    @Inject(CCXTService)
    private ccxtService: CCXTService,
    @Inject(UniswapService)
    private uniswapService: UniswapService,
    @Inject(RecordsService)
    private recordsService: RecordsService,
    @InjectRepository(LiquidityScoreRepository)
    private liquidityScoreRepository: LiquidityScoreRepository,
  ) {}

  public async calculateLiquidityScore(
    payload: LiquidityScoreCalculateRequestDto,
  ): Promise<UploadFile | null> {
    this.logger.debug(
      `Calculating liquidity score for campaign ${payload.address}`,
    );

    this.logger.debug(
      `Fetching campaign ${payload.address} from chain ${payload.chainId}`,
    );
    const campaign = await this.campaignService.getCampaign(
      payload.chainId,
      payload.address,
    );

    if (!campaign) {
      throw new ControlledError(ErrorCampaign.NotFound, HttpStatus.NOT_FOUND);
    }

    const campaignLiquidityScore =
      await this._calculateCampaignLiquidityScore(campaign);

    return await this.recordsService.pushLiquidityScores(
      campaign.address,
      campaign.chainId,
      campaignLiquidityScore,
    );
  }

  private async _calculateCampaignLiquidityScore(
    campaign: CampaignEntity,
  ): Promise<LiquidityScore[]> {
    if (!campaign.exchangeName) {
      throw new ControlledError(
        ErrorCampaign.InvalidCampaignData,
        HttpStatus.BAD_REQUEST,
      );
    }

    const isCEXCampaign = isCenteralizedExchange(campaign.exchangeName);

    const campaignLiquidityScore: LiquidityScore[] = [];

    const fromDate = campaign.lastSyncedAt;
    let toDate = campaign.endDate;

    if (new Date() < toDate) {
      toDate = new Date();
    }

    for (const user of campaign.users) {
      let liquidityScore;

      if (isCEXCampaign) {
        liquidityScore = await this._calculateCEXLiquidityScore(
          campaign.exchangeName,
          campaign.token,
          user,
          fromDate,
          toDate,
        );
      } else {
        liquidityScore = await this._calculateDEXLiquidityScore(
          campaign.exchangeName,
          campaign.chainId,
          campaign.token,
          user,
          fromDate,
          toDate,
        );
      }

      // Round the Liquidity Score
      liquidityScore = Math.round(liquidityScore);

      if (liquidityScore === 0) {
        continue;
      }

      await this._saveLiquidityScore(campaign, user, liquidityScore);

      campaignLiquidityScore.push({
        chainId: campaign.chainId,
        liquidityProvider: user.evmAddress,
        liquidityScore: liquidityScore.toString(),
      });
    }

    await this.campaignService.updateLastSyncedAt(campaign, new Date());

    return campaignLiquidityScore;
  }

  private async _calculateCEXLiquidityScore(
    exchangeName: string,
    symbol: string,
    user: UserEntity,
    since: Date,
    to: Date,
  ): Promise<number> {
    try {
      this.logger.debug(
        `Calculating liquidity score for user ${user.evmAddress} on exchange ${exchangeName} for symbol ${symbol} from ${since} to ${to}`,
      );

      const encryption = await Encryption.build(
        this.pgpConfigService.privateKey,
        this.pgpConfigService.passphrase,
      );

      const exchangeAPIKey =
        await this.exchangeAPIKeyRepository.findByUserAndExchange(
          user,
          exchangeName,
        );

      if (!exchangeAPIKey) {
        this.logger.warn(
          `No API key found for user ${user.evmAddress} on exchange ${exchangeName}`,
        );
        return 0;
      }

      const apiKey = await encryption.decrypt(exchangeAPIKey.apiKey);
      const secret = await encryption.decrypt(exchangeAPIKey.secret);

      const exchange = this.ccxtService.getExchangeInstance(
        exchangeName,
        new TextDecoder().decode(apiKey),
        new TextDecoder().decode(secret),
      );

      const trades = await this.ccxtService.fetchTrades(
        exchange,
        symbol,
        since.getTime(),
      );
      const tradeVolume = trades
        .filter((trade) => trade.timestamp < to.getTime())
        .reduce((acc, trade) => acc + trade.cost, 0);

      const { openOrderVolume, averageDuration, spread } =
        await this.ccxtService.processOpenOrders(
          exchange,
          symbol,
          since.getTime(),
          to.getTime(),
        );

      const liquidityScoreCalculation = new LiquidityScoreCalculation(
        tradeVolume,
        openOrderVolume,
        averageDuration,
        spread,
      );

      return liquidityScoreCalculation.calculate();
    } catch (e) {
      this.logger.error(
        `Failed to calculate liquidity score for user ${user.evmAddress} on exchange ${exchangeName} for symbol ${symbol} from ${since} to ${to}`,
      );

      return 0;
    }
  }

  private async _calculateDEXLiquidityScore(
    exchangeName: string,
    chainId: number,
    token: string,
    user: UserEntity,
    from: Date,
    to: Date,
  ): Promise<number> {
    try {
      let trades: number[] = [];

      switch (exchangeName) {
        case 'uniswap':
          trades = await this.uniswapService.fetchTrades(
            chainId,
            user.evmAddress,
            token,
            from,
            to,
          );
          break;
      }

      const tradeVolume = trades.reduce((acc, trade) => acc + trade, 0);

      const liquidityScoreCalculation = new LiquidityScoreCalculation(
        tradeVolume,
        // Open orders are not applicable for DEXs
        0,
        0,
        1,
      );

      return liquidityScoreCalculation.calculate();
    } catch (e) {
      this.logger.error(
        `Failed to calculate liquidity score for user ${user.evmAddress} on exchange ${exchangeName} for token ${token} from ${from} to ${to}`,
      );
      return 0;
    }
  }

  public async _saveLiquidityScore(
    campaign: CampaignEntity,
    user: UserEntity,
    score: number,
  ) {
    const liquidityScore = new LiquidityScoreEntity();

    liquidityScore.campaign = campaign;
    liquidityScore.user = user;
    liquidityScore.score = score;
    liquidityScore.calculatedAt = new Date();

    await this.liquidityScoreRepository.createUnique(liquidityScore);
  }

  // Adjust the frequency as needed
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateScoresForCampaigns(): Promise<void> {
    this.logger.log('Calculating liquidity scores for all active campaigns');

    const campaigns = await this.campaignService.getAllActiveCampaigns();

    for (const campaign of campaigns) {
      let campaignLiquidityScore = [];

      try {
        campaignLiquidityScore =
          await this._calculateCampaignLiquidityScore(campaign);
      } catch {
        this.logger.error(
          `Failed to calculate liquidity score for campaign ${campaign.address}`,
        );
      }

      await this.recordsService.pushLiquidityScores(
        campaign.address,
        campaign.chainId,
        campaignLiquidityScore,
      );
    }

    this.logger.log('Finished calculating liquidity scores');
  }
}

class LiquidityScoreCalculation {
  constructor(
    public readonly tradeVolume: number,
    public readonly openOrderVolume: number,
    public readonly orderDuration: number, // Duration in the order book in minutes
    public readonly spread: number,
  ) {}

  calculate(): number {
    return (
      this.tradeVolume +
      (0.1 * this.openOrderVolume * this.orderDuration) / this.spread
    );
  }
}
