import { Encryption, UploadFile } from '@human-protocol/sdk';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';

import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorCampaign } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { LiquidityScore } from '../../common/types/liquidity-score';
import { isCenteralizedExchange } from '../../common/utils/exchange';
import { CampaignEntity, UserEntity } from '../../database/entities';
import { CampaignService } from '../campaign/campaign.service';
import { CCXTService } from '../exchange/ccxt.service';
import { UniswapService } from '../exchange/uniswap.service';
import { RecordsService } from '../records/records.service';
import { ExchangeAPIKeyRepository } from '../user/exchange-api-key.repository';

import { LiquidityScoreCalculateRequestDto } from './liquidity-score.dto';
import { LiquidityScoreCalculation } from './liquidity-score.model';
import { LiquidityScoreRepository } from './liquidity-score.repository';

@Injectable()
export class LiquidityScoreService {
  private logger: Logger = new Logger(LiquidityScoreService.name);
  private encryption?: Encryption;

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
  ): Promise<UploadFile[] | null> {
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
    this.logger.debug(`This is the campaign ${campaign.address}`);

    if (!campaign) {
      throw new ControlledError(ErrorCampaign.NotFound, HttpStatus.NOT_FOUND);
    }

    if (!(campaign.lastSyncedAt < campaign.endDate)) {
      throw new ControlledError(
        ErrorCampaign.CampaignEnded,
        HttpStatus.BAD_REQUEST,
      );
    }
    this.logger.debug(
      `Starting the calculation of scores for campaign ${campaign.address}`,
    );
    return await this.calculatePendingCampaignLiquidityScores(campaign);
  }

  private async calculatePendingCampaignLiquidityScores(
    campaign: CampaignEntity,
  ): Promise<UploadFile[] | null> {
    if (!campaign.exchangeName) {
      throw new ControlledError(
        ErrorCampaign.InvalidCampaignData,
        HttpStatus.BAD_REQUEST,
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    let startDate =
      campaign.lastSyncedAt < campaign.startDate
        ? campaign.startDate
        : campaign.lastSyncedAt;

    const scoresFiles: UploadFile[] = [];

    if (
      !(
        new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        ) <= yesterday
      )
    ) {
      this.logger.debug(
        `Cannot calculate score now for ${campaign.address}, 24 hours have not passed yet since the last calculation.`,
      );
    }
    if (startDate >= campaign.endDate) {
      this.logger.debug(
        `Cannot calculate score now for ${campaign.address}, campaign has already ended.`,
      );
    }

    while (
      new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      ) <= yesterday &&
      startDate < campaign.endDate
    ) {
      const isCEXCampaign = isCenteralizedExchange(campaign.exchangeName);
      let windowEnd = new Date(startDate.getTime());
      windowEnd.setHours(0, 0, 0, 0);
      windowEnd = new Date(windowEnd.getTime() + 24 * 60 * 60 * 1000);
      windowEnd = windowEnd > campaign.endDate ? campaign.endDate : windowEnd;

      const scores: LiquidityScore[] = [];

      for (const user of campaign.users) {
        const liquidityScore = isCEXCampaign
          ? await this._calculateCEXLiquidityScore(
              campaign.exchangeName.toLowerCase(),
              campaign.token,
              user,
              startDate,
              windowEnd,
            )
          : await this._calculateDEXLiquidityScore(
              campaign.exchangeName.toLowerCase(),
              campaign.chainId,
              campaign.token,
              user,
              startDate,
              windowEnd,
            );

        const scoreToUpload =
          liquidityScore &&
          Number.isFinite(liquidityScore) &&
          liquidityScore > 0
            ? Math.round(liquidityScore)
            : 0;

        await this._saveLiquidityScore(
          campaign,
          user,
          scoreToUpload,
          startDate,
          windowEnd,
        );

        scores.push({
          chainId: campaign.chainId,
          liquidityProvider: user.evmAddress,
          liquidityScore: String(scoreToUpload),
        });
      }
      if (scores.length === 0) {
        this.logger.warn(`No scores for campaign ${campaign.address}`);
        return null;
      }

      const scoresFile = await this.recordsService.pushLiquidityScores(
        campaign.address,
        campaign.chainId,
        scores,
      );

      await this.campaignService.updateLastSyncedAt(campaign, windowEnd);

      scoresFiles.push(scoresFile);
      startDate = windowEnd;
    }

    return scoresFiles;
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

      const encryption = await this._getEncryption();

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

      const apiKey = new TextDecoder().decode(
        await encryption.decrypt(exchangeAPIKey.apiKey),
      );
      const secret = new TextDecoder().decode(
        await encryption.decrypt(exchangeAPIKey.secret),
      );

      const exchange = this.ccxtService.getExchangeInstance(
        exchangeName,
        apiKey,
        secret,
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

  private async _saveLiquidityScore(
    campaign: CampaignEntity,
    user: UserEntity,
    score: number,
    windowStart: Date,
    windowEnd: Date,
  ) {
    await this.liquidityScoreRepository.upsert(
      {
        campaignId: campaign.id,
        userId: user.id,
        windowStart,
        windowEnd,
        score,
        calculatedAt: new Date(),
      },
      ['campaignId', 'userId', 'windowStart'],
    );
  }

  private async _getEncryption(): Promise<Encryption> {
    if (this.encryption) return this.encryption;

    const { privateKey, passphrase } = this.pgpConfigService;

    try {
      this.encryption = await Encryption.build(privateKey, passphrase);
    } catch (err: any) {
      if (
        err?.message?.includes('Key packet is already decrypted') ||
        err?.message?.includes('private key is not encrypted')
      ) {
        this.logger.warn(
          'PGP key already decrypted – instantiating Encryption without pass-phrase',
        );
        this.encryption = await Encryption.build(privateKey);
      } else {
        throw err;
      }
    }

    return this.encryption;
  }

  public async getTotalLiquidityScore(): Promise<number> {
    const { total } = await this.liquidityScoreRepository
      .createQueryBuilder('T')
      .select('COALESCE(SUM(T.score),0)', 'total')
      .getRawOne();
    return Number(Number(total).toFixed(2));
  }

  // Adjust the frequency as needed
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateScoresForCampaigns(): Promise<void> {
    this.logger.log('Calculating liquidity scores for all active campaigns');

    const campaigns = await this.campaignService.getAllActiveCampaigns();

    for (const campaign of campaigns) {
      try {
        await this.calculatePendingCampaignLiquidityScores(campaign);

        this.logger.log('Finished calculating liquidity scores');
      } catch (error) {
        this.logger.error(
          `Failed to calculate liquidity score for campaign ${campaign.address}`,
          error,
        );
      }
    }
  }
}
