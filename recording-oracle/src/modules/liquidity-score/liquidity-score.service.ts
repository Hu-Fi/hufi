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
  private readonly logger = new Logger(LiquidityScoreService.name);

  constructor(
    @Inject(CampaignService) private campaignService: CampaignService,
    @Inject(PGPConfigService) private pgpConfigService: PGPConfigService,
    @InjectRepository(ExchangeAPIKeyRepository)
    private exchangeAPIKeyRepository: ExchangeAPIKeyRepository,
    @Inject(CCXTService) private ccxtService: CCXTService,
    @Inject(UniswapService) private uniswapService: UniswapService,
    @Inject(RecordsService) private recordsService: RecordsService,
    @InjectRepository(LiquidityScoreRepository)
    private liquidityScoreRepository: LiquidityScoreRepository,
  ) {}

  /** Manual trigger */
  public async calculateLiquidityScore(
    payload: LiquidityScoreCalculateRequestDto,
  ): Promise<UploadFile | null> {
    const campaign = await this._loadCampaignOrFail(
      payload.chainId,
      payload.address,
    );

    const scores = await this._calculateCampaignLiquidityScore(campaign);

    return this.recordsService.pushLiquidityScores(
      campaign.address,
      campaign.chainId,
      scores,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateScoresForCampaigns(): Promise<void> {
    this.logger.log('Calculating liquidity scores for active campaigns');

    for (const campaign of await this.campaignService.getAllActiveCampaigns()) {
      try {
        const scores = await this._calculateCampaignLiquidityScore(campaign);
        await this.recordsService.pushLiquidityScores(
          campaign.address,
          campaign.chainId,
          scores,
        );
      } catch (err) {
        this.logger.error(
          `Liquidity‑score job failed for ${campaign.address}`,
          err as any,
        );
      }
    }

    this.logger.log('Liquidity‑score job finished');
  }

  private async _loadCampaignOrFail(chainId: number, address: string) {
    const campaign = await this.campaignService.getCampaign(chainId, address);
    if (!campaign) {
      throw new ControlledError(ErrorCampaign.NotFound, HttpStatus.NOT_FOUND);
    }
    return campaign;
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

    const isCEX = isCenteralizedExchange(campaign.exchangeName);
    const from = campaign.lastSyncedAt ?? campaign.createdAt ?? new Date(0);
    const to =
      campaign.endDate && campaign.endDate < new Date()
        ? campaign.endDate
        : new Date();

    const scores: LiquidityScore[] = [];

    for (const user of campaign.users) {
      let raw = 0;

      if (isCEX) {
        raw = await this._calculateCEXLiquidityScore(
          campaign.exchangeName.toLowerCase(),
          campaign.token,
          user,
          from,
          to,
        );
      } else {
        raw = await this._calculateDEXLiquidityScore(
          campaign.exchangeName.toLowerCase(),
          campaign.chainId,
          campaign.token,
          user,
          from,
          to,
        );
      }

      if (!Number.isFinite(raw) || raw <= 0) continue;

      const rounded = Math.round(raw);

      await this._saveLiquidityScore(campaign, user, rounded);

      scores.push({
        chainId: campaign.chainId,
        liquidityProvider: user.evmAddress,
        liquidityScore: String(rounded),
      });
    }

    await this.campaignService.updateLastSyncedAt(campaign, to);
    return scores;
  }

  private async _calculateCEXLiquidityScore(
    exchangeName: string,
    symbol: string,
    user: UserEntity,
    since: Date,
    to: Date,
  ): Promise<number> {
    try {
      const encryption = await Encryption.build(
        this.pgpConfigService.privateKey,
        this.pgpConfigService.passphrase,
      );

      const creds = await this.exchangeAPIKeyRepository.findByUserAndExchange(
        user,
        exchangeName,
      );
      if (!creds) return 0;

      const apiKey = new TextDecoder().decode(
        await encryption.decrypt(creds.apiKey),
      );
      const secret = new TextDecoder().decode(
        await encryption.decrypt(creds.secret),
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
        .filter((t) => t.timestamp < to.getTime())
        .reduce((acc, t) => acc + t.cost, 0);

      const {
        openOrderVolume = 0,
        averageDuration = 0,
        spread = 1,
      } = await this.ccxtService.processOpenOrders(
        exchange,
        symbol,
        since.getTime(),
        to.getTime(),
      );

      return new LiquidityScoreCalculation(
        tradeVolume,
        openOrderVolume,
        averageDuration,
        Math.max(spread, 1), // avoid ÷0
      ).calculate();
    } catch (err) {
      this.logger.error(
        `CEX liquidity‑score calc failed for ${user.evmAddress} @ ${exchangeName}`,
        err as any,
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
      const trades =
        exchangeName === 'uniswap'
          ? await this.uniswapService.fetchTrades(
              chainId,
              user.evmAddress,
              token,
              from,
              to,
            )
          : [];

      const volume = trades.reduce((acc, v) => acc + v, 0);

      return new LiquidityScoreCalculation(volume, 0, 0, 1).calculate();
    } catch (err) {
      this.logger.error(
        `DEX liquidity‑score calc failed for ${user.evmAddress} @ ${exchangeName}`,
        err as any,
      );
      return 0;
    }
  }

  private async _saveLiquidityScore(
    campaign: CampaignEntity,
    user: UserEntity,
    score: number,
  ) {
    await this.liquidityScoreRepository.upsert(
      {
        campaign,
        user,
        score,
        calculatedAt: new Date(),
      },
      {
        conflictPaths: { campaign: true, user: true },
        skipUpdateIfNoValuesChanged: true,
      },
    );
  }
}
