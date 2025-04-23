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
import { RecordsService } from '../records/records.service';
import { ExchangeAPIKeyRepository } from '../user/exchange-api-key.repository';

import { LiquidityScoreCalculateRequestDto } from './liquidity-score.dto';
import { LiquidityScoreCalculation } from './liquidity-score.model';
import { LiquidityScoreRepository } from './liquidity-score.repository';

@Injectable()
export class LiquidityScoreService {
  private readonly logger = new Logger(LiquidityScoreService.name);
  private encryption?: Encryption;

  constructor(
    @Inject(CampaignService) private campaignService: CampaignService,
    @Inject(PGPConfigService) private pgpConfigService: PGPConfigService,
    @InjectRepository(ExchangeAPIKeyRepository)
    private exchangeAPIKeyRepository: ExchangeAPIKeyRepository,
    @Inject(CCXTService) private ccxtService: CCXTService,
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

    this.logger.debug(
      `Manually pushing ${scores.length} scores for ${campaign.address} (${campaign.chainId})`,
    );

    return this.recordsService.pushLiquidityScores(
      campaign.address,
      campaign.chainId,
      scores,
    );
  }

  /** Nightly cron – every midnight */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateScoresForCampaigns(): Promise<void> {
    this.logger.log('Cron: liquidity‑score job starting');

    for (const campaign of await this.campaignService.getAllActiveCampaigns()) {
      try {
        const scores = await this._calculateCampaignLiquidityScore(campaign);

        this.logger.debug(
          `[Cron] Campaign ${campaign.address} – pushing ${scores.length} scores`,
        );

        await this.recordsService.pushLiquidityScores(
          campaign.address,
          campaign.chainId,
          scores,
        );
      } catch (err) {
        this.logger.error(
          `[Cron] Liquidity‑score job failed for ${campaign.address}`,
          err as any,
        );
      }
    }

    this.logger.log('Cron: liquidity‑score job finished');
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

    /*
     * Window = last 24 h ending "now".
     * by flooring both times to midnight UTC.
     */
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - 24 * 3600_000);

    this.logger.debug(
      `Processing campaign ${campaign.address} – ${isCEX ? 'CEX' : 'DEX'} – ` +
        `window ${windowStart.toISOString()} → ${windowEnd.toISOString()} – ` +
        `${campaign.users.length} users`,
    );

    const scores: LiquidityScore[] = [];
    let allUsersSucceeded = true;

    for (const user of campaign.users) {
      this.logger.verbose(
        `⇒ Calculating for user ${user.id} (${user.evmAddress})`,
      );

      const raw = await this._calculateCEXLiquidityScore(
        campaign.exchangeName.toLowerCase(),
        campaign.token,
        user,
        windowStart,
        windowEnd,
      );

      if (raw === null) {
        allUsersSucceeded = false;
        this.logger.warn(
          `Failed to compute score for user ${user.id} – will retry next run`,
        );
        continue;
      }

      this.logger.verbose(`⇐ User ${user.id} raw score = ${raw.toFixed(4)}`);

      if (!Number.isFinite(raw) || raw <= 0) continue;
      const rounded = Math.round(raw);

      await this._saveLiquidityScore(
        campaign,
        user,
        rounded,
        windowStart,
        windowEnd,
      );

      scores.push({
        chainId: campaign.chainId,
        liquidityProvider: user.evmAddress,
        liquidityScore: String(rounded),
      });

      this.logger.verbose(
        `Stored rounded score ${rounded} for user ${user.id}`,
      );
    }

    if (allUsersSucceeded) {
      await this.campaignService.updateLastSyncedAt(campaign, windowEnd);
      this.logger.debug(
        `Campaign ${campaign.address} – finished OK (${scores.length} scores). ` +
          `lastSyncedAt moved to ${windowEnd.toISOString()}`,
      );
    } else {
      this.logger.warn(
        `Campaign ${campaign.address} – partial failure. lastSyncedAt left unchanged (${campaign.lastSyncedAt?.toISOString() ?? 'null'})`,
      );
    }

    return scores;
  }

  /**
   * Fetch trades & orders for a single user and calculate raw score.
   * Returns **null** on error, number on success (may be 0).
   */
  private async _calculateCEXLiquidityScore(
    exchangeName: string,
    symbol: string,
    user: UserEntity,
    since: Date,
    to: Date,
  ): Promise<number | null> {
    try {
      const encryption = await this._getEncryption();

      const creds = await this.exchangeAPIKeyRepository.findByUserAndExchange(
        user,
        exchangeName,
      );
      if (!creds) {
        this.logger.verbose(
          `No creds for ${user.evmAddress} on ${exchangeName}`,
        );
        return 0; // treat as success with zero score
      }

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

      this.logger.verbose(
        `[${exchangeName}] ${user.id} – tradeVol=${tradeVolume}, ` +
          `openVol=${openOrderVolume}, avgDur=${averageDuration}, spread=${spread}`,
      );

      const result = new LiquidityScoreCalculation(
        tradeVolume,
        openOrderVolume,
        averageDuration,
        Math.max(spread, 1),
      ).calculate();

      this.logger.verbose(
        `[${exchangeName}] ${user.id} – raw score calculated = ${result}`,
      );

      return result;
    } catch (err) {
      this.logger.error(
        `CEX liquidity‑score calc failed for ${user.evmAddress} @ ${exchangeName}`,
        err as any,
      );
      return null;
    }
  }

  /** Returns cached Encryption instance or builds a new one. */
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
          'PGP key already decrypted – instantiating Encryption without pass‑phrase',
        );
        this.encryption = await Encryption.build(privateKey);
      } else {
        throw err;
      }
    }

    return this.encryption;
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
}
