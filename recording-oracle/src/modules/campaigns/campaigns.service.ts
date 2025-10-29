import crypto from 'crypto';

import {
  ESCROW_BULK_PAYOUT_MAX_ITEMS,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  OrderDirection,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import _ from 'lodash';
import { LRUCache } from 'lru-cache';

import { ContentType } from '@/common/enums';
import * as debugUtils from '@/common/utils/debug';
import * as decimalUtils from '@/common/utils/decimal';
import Environment from '@/common/utils/environment';
import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import * as web3Utils from '@/common/utils/web3';
import { isValidExchangeName } from '@/common/validators';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import {
  ExchangeApiAccessError,
  ExchangeApiClientFactory,
} from '@/modules/exchange';
import {
  ExchangeApiKeyData,
  ExchangeApiKeyNotFoundError,
  ExchangeApiKeysService,
} from '@/modules/exchange-api-keys';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import { CampaignEntity } from './campaign.entity';
import {
  CampaignAlreadyFinishedError,
  CampaignNotFoundError,
  CampaignNotStartedError,
  InvalidCampaign,
  UserIsNotParticipatingError,
} from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import * as manifestUtils from './manifest.utils';
import {
  type CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  CampaignProgressMeta,
  HoldingProgressChecker,
  MarketMakingProgressChecker,
  ProgressCheckResult,
} from './progress-checking';
import { HoldingMeta } from './progress-checking/holding';
import { MarketMakingMeta } from './progress-checking/market-making';
import { isHoldingCampaign, isMarketMakingCampaign } from './type-guards';
import {
  CampaignEscrowInfo,
  CampaignManifest,
  CampaignManifestBase,
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  IntermediateResult,
  IntermediateResultsData,
  ParticipantOutcome,
} from './types';
import { UserCampaignEntity } from './user-campaign.entity';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatsRepository } from './volume-stats.repository';

const PROGRESS_RECORDING_SCHEDULE = Environment.isDevelopment()
  ? CronExpression.EVERY_MINUTE
  : CronExpression.EVERY_30_MINUTES;

const CAMPAIGNS_FINISH_TRACKING_SCHEDULE = Environment.isDevelopment()
  ? CronExpression.EVERY_MINUTE
  : CronExpression.EVERY_HOUR;

const NEW_CAMPAIGNS_DISCOVERY_SCHEDULE = Environment.isDevelopment()
  ? CronExpression.EVERY_MINUTE
  : CronExpression.EVERY_10_MINUTES;

const campaignsProgressCache = new LRUCache<
  string,
  CampaignProgress<CampaignProgressMeta>
>({
  ttl: 1000 * 60 * 10,
  max: 4200,
  ttlAutopurge: false,
  allowStale: false,
  noDeleteOnStaleGet: false,
  noUpdateTTL: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

@Injectable()
export class CampaignsService {
  private readonly logger = logger.child({
    context: CampaignsService.name,
  });

  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly exchangeApiKeysService: ExchangeApiKeysService,
    private readonly userCampaignsRepository: UserCampaignsRepository,
    private readonly storageService: StorageService,
    private readonly volumeStatsRepository: VolumeStatsRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly pgAdvisoryLock: PgAdvisoryLock,
    private readonly moduleRef: ModuleRef,
  ) {}

  async findOneByChainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<CampaignEntity | null> {
    web3Utils.assertValidEvmAddress(address);

    const checksummedAddress = ethers.getAddress(address);

    return this.campaignsRepository.findOneByChainIdAndAddress(
      chainId,
      checksummedAddress,
    );
  }

  async join(
    userId: string,
    chainId: number,
    campaignAddress: string,
  ): Promise<string> {
    let campaign = await this.findOneByChainIdAndAddress(
      chainId,
      campaignAddress,
    );

    // Create a new campaign if it does not exist
    if (!campaign) {
      const { manifest, escrowInfo } = await this.retrieveCampaignData(
        chainId,
        campaignAddress,
      );
      campaign = await this.createCampaign(
        chainId,
        campaignAddress,
        manifest,
        escrowInfo,
      );
    }

    const isUserJoined =
      await this.userCampaignsRepository.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    if (isUserJoined) {
      return campaign.id;
    }

    if (campaign.endDate.valueOf() <= Date.now()) {
      /**
       * Safety belt to disallow joining campaigns that already finished
       * but might be waiting for results recording or payouts
       */
      throw new CampaignAlreadyFinishedError(
        campaign.chainId,
        campaign.address,
      );
    }

    await this.exchangeApiKeysService.assertUserHasAuthorizedKeys(
      userId,
      campaign.exchangeName,
    );

    const newUserCampaign = new UserCampaignEntity();
    newUserCampaign.userId = userId;
    newUserCampaign.campaignId = campaign.id;
    newUserCampaign.createdAt = new Date();

    await this.userCampaignsRepository.insert(newUserCampaign);

    return campaign.id;
  }

  async createCampaign(
    chainId: number,
    address: string,
    manifest: CampaignManifest,
    escrowInfo: CampaignEscrowInfo,
  ): Promise<CampaignEntity> {
    const { symbol, details } = manifestUtils.extractCampaignDetails(manifest);

    const newCampaign = new CampaignEntity();
    newCampaign.id = crypto.randomUUID();
    newCampaign.chainId = chainId;
    newCampaign.address = ethers.getAddress(address);
    newCampaign.type = manifest.type as CampaignType;
    newCampaign.exchangeName = manifest.exchange;
    newCampaign.symbol = symbol;
    newCampaign.startDate = manifest.start_date;
    newCampaign.endDate = manifest.end_date;
    newCampaign.fundAmount = escrowInfo.fundAmount.toString();
    newCampaign.fundToken = escrowInfo.fundTokenSymbol;
    newCampaign.fundTokenDecimals = escrowInfo.fundTokenDecimals;
    newCampaign.details = details;
    newCampaign.status = CampaignStatus.ACTIVE;
    newCampaign.lastResultsAt = null;

    await this.campaignsRepository.insert(newCampaign);

    return newCampaign;
  }

  async getJoined(
    userId: string,
    options?: Partial<{
      statuses?: CampaignStatus[];
      limit: number;
      skip: number;
    }>,
  ): Promise<CampaignEntity[]> {
    const userCampaigns = await this.userCampaignsRepository.findByUserId(
      userId,
      {
        statuses: options?.statuses,
        limit: options?.limit,
        skip: options?.skip,
      },
    );

    return userCampaigns;
  }

  private async retrieveCampaignData(
    chainId: number,
    campaignAddress: string,
  ): Promise<{
    manifest: CampaignManifest;
    escrowInfo: CampaignEscrowInfo;
  }> {
    const escrow = await EscrowUtils.getEscrow(chainId, campaignAddress);
    if (!escrow) {
      throw new CampaignNotFoundError(chainId, campaignAddress);
    }

    // Safety-belt for missing subgraph data START
    if (!escrow.token) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        'Missing fund token data',
      );
    }
    if (!escrow.totalFundedAmount) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        'Missing fund amount data',
      );
    }
    if (!escrow.manifest) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        'Missing manifest data',
      );
    }
    // Safety-belt for missing subgraph data END

    const isEscrowForThisOracle =
      escrow.recordingOracle?.toLowerCase() ===
      this.web3ConfigService.operatorAddress.toLowerCase();

    if (!isEscrowForThisOracle) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        `Invalid recording oracle address: ${escrow.recordingOracle}`,
      );
    }

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const escrowStatus = await escrowClient.getStatus(campaignAddress);

    if (
      [EscrowStatus.Cancelled, EscrowStatus.Complete].includes(escrowStatus)
    ) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        `Invalid status: ${EscrowStatus[escrowStatus]}`,
      );
    }

    let manifestString: string;
    if (httpUtils.isValidHttpUrl(escrow.manifest as string)) {
      try {
        manifestString = await manifestUtils.downloadCampaignManifest(
          escrow.manifest as string,
          escrow.manifestHash as string,
        );
      } catch (error) {
        this.logger.error('Failed to download campaign manifest', error);
        throw new InvalidCampaign(
          chainId,
          campaignAddress,
          error.message as string,
        );
      }
    } else {
      manifestString = escrow.manifest as string;
    }

    let manifest: CampaignManifestBase;
    try {
      manifest = manifestUtils.validateBaseSchema(manifestString);
    } catch (error) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        error.message as string,
      );
    }

    /*
     * Not including this into Joi schema to send meaningful errors
     */
    if (!isValidExchangeName(manifest.exchange)) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        `Exchange not supported: ${manifest.exchange}`,
      );
    }

    try {
      switch (manifest.type) {
        case CampaignType.MARKET_MAKING:
          manifestUtils.assertValidMarketMakingCampaignManifest(manifest);
          break;
        case CampaignType.HOLDING:
          manifestUtils.assertValidHoldingCampaignManifest(manifest);
          break;
        default:
          throw new Error(`Campaign type not supported: ${manifest.type}`);
      }
    } catch (error) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        error.message as string,
      );
    }

    const [campaignTokenSymbol, campaignTokenDecimals] = await Promise.all([
      this.web3Service.getTokenSymbol(chainId, escrow.token),
      this.web3Service.getTokenDecimals(chainId, escrow.token),
    ]);

    return {
      manifest,
      escrowInfo: {
        fundAmount: Number(
          ethers.formatUnits(escrow.totalFundedAmount, campaignTokenDecimals),
        ),
        fundTokenSymbol: campaignTokenSymbol,
        fundTokenDecimals: campaignTokenDecimals,
      },
    };
  }

  @Cron(PROGRESS_RECORDING_SCHEDULE)
  async recordCampaignsProgress(): Promise<void> {
    this.logger.debug('Campaigns progress recording job started');

    try {
      /**
       * Atm we don't expect many active campaigns
       * so it's fine to get all at once, but later
       * we might need to query them in batches or as stream.
       */
      const campaignsToCheck =
        await this.campaignsRepository.findForProgressRecording();

      for (const campaign of campaignsToCheck) {
        const signer = this.web3Service.getSigner(campaign.chainId);
        const escrowClient = await EscrowClient.build(signer);
        const escrowStatus = await escrowClient.getStatus(campaign.address);
        /**
         * Safety-belt for case when tracking job
         * has not cancelled this campaign yet, but
         * it's already cancelled on blockchain
         */
        if (escrowStatus === EscrowStatus.Cancelled) {
          this.logger.warn('Campaign cancelled, skipping progress recording', {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          });
          continue;
        }
        /**
         * Right now for simplicity process sequentially.
         * Later we can add "fastq" usage for parallel processing
         * and "backpressured" adding to the queue.
         */
        await this.recordCampaignProgress(campaign);
      }
    } catch (error) {
      this.logger.error('Error while recording campaigns progress', error);
    }

    this.logger.debug('Campaigns progress recording job finished');
  }

  async recordCampaignProgress(campaign: CampaignEntity): Promise<void> {
    await this.pgAdvisoryLock.withLock(
      `record-campaign-progress:${campaign.id}`,
      async () => {
        if (campaign.status !== CampaignStatus.ACTIVE) {
          // safety-belt
          return;
        }

        const logger = this.logger.child({
          action: 'recordCampaignProgress',
          campaignId: campaign.id,
          chainId: campaign.chainId,
          campaignAddress: campaign.address,
          exchangeName: campaign.exchangeName,
          symbol: campaign.symbol,
          type: campaign.type,
        });
        logger.debug('Campaign progress recording started');

        try {
          let startDate = campaign.startDate;

          let intermediateResults =
            await this.retrieveCampaignIntermediateResults(campaign);

          if (intermediateResults) {
            const { to: lastResultAt } = intermediateResults.results.at(
              -1,
            ) as IntermediateResult;

            const isOngoingCampaign = campaign.endDate > new Date();
            const lastResultDate = new Date(lastResultAt);
            if (isOngoingCampaign && dayjs().diff(lastResultAt, 'day') === 0) {
              /**
               * If campaign is ongoing - check results only once in 24.
               * If campaing ended - let it record results immediately to reduce the wait.
               */
              logger.debug('Less than a day passed from previous check', {
                lastResultAt,
              });
              return;
            }

            /**
             * Add 1 ms to end date because interval boundaries are inclusive
             */
            startDate = new Date(lastResultDate.valueOf() + 1);
          } else {
            intermediateResults = {
              chain_id: campaign.chainId,
              address: campaign.address,
              exchange: campaign.exchangeName,
              symbol: campaign.symbol,
              results: [],
            };
          }

          let endDate = dayjs(startDate).add(1, 'day').toDate();
          if (endDate > campaign.endDate) {
            endDate = campaign.endDate;
          }

          // safety-belt
          if (startDate >= endDate) {
            /**
             * This can happen only in situations when:
             * - by some reason we lost data about campaign from DB, then re-added it
             * - by some reason campaign was 'pending_completion'/'completed', but status changed to 'active'
             *
             * and then attempted to record it's progress but it must be
             * already finished and start-end dates overlap indicates that,
             * so just mark it as pending_completion, otherwise it leads to invalid intermediate results.
             */
            logger.warn('Campaign progress period dates overlap');
            campaign.status = CampaignStatus.PENDING_COMPLETION;
            campaign.lastResultsAt = new Date();
            await this.campaignsRepository.save(campaign);
            return;
          }

          const progress = await this.checkCampaignProgressForPeriod(
            campaign,
            startDate,
            endDate,
          );

          let progressValueTarget: number;
          let progressValue: number;
          if (isMarketMakingCampaign(campaign)) {
            progressValueTarget = campaign.details.dailyVolumeTarget;
            progressValue = (progress.meta as MarketMakingMeta).total_volume;
          } else if (isHoldingCampaign(campaign)) {
            progressValueTarget = campaign.details.dailyBalanceTarget;
            progressValue = (progress.meta as HoldingMeta).total_balance;
          } else {
            throw new Error(
              `Unknown campaign type for reward pool calculation: ${campaign.type}`,
            );
          }

          const rewardPool = this.calculateRewardPool({
            maxRewardPool: this.calculateDailyReward(campaign),
            progressValueTarget,
            progressValue,
            fundTokenDecimals: campaign.fundTokenDecimals,
          });

          const intermediateResult: IntermediateResult = {
            from: progress.from,
            to: progress.to,
            reserved_funds: rewardPool,
            participants_outcomes_batches: [],
            ...progress.meta,
          };
          for (const chunk of _.chunk(
            progress.participants_outcomes,
            ESCROW_BULK_PAYOUT_MAX_ITEMS,
          )) {
            intermediateResult.participants_outcomes_batches.push({
              id: crypto.randomUUID(),
              results: chunk,
            });
          }

          intermediateResults.results.push(intermediateResult);

          const storedResultsMeta =
            await this.recordCampaignIntermediateResults(intermediateResults);

          logger.info('Campaign progress recorded', {
            from: progress.from,
            to: progress.to,
            reserved_funds: rewardPool,
            ...progress.meta,
            resultsUrl: storedResultsMeta.url,
          });

          if (isMarketMakingCampaign(campaign)) {
            void this.recordGeneratedVolume(campaign, intermediateResult);
          }

          /**
           * There might be situations when due to delays/failures in processing
           * we reach campaign end date but still have periods to process,
           * so mark campaign as pending completion only if results recorded for all periods,
           * otherwise keep it as is to wait for all periods to be recorded.
           */
          if (endDate.valueOf() === campaign.endDate.valueOf()) {
            campaign.status = CampaignStatus.PENDING_COMPLETION;
          }

          campaign.lastResultsAt = new Date();
          await this.campaignsRepository.save(campaign);
        } catch (error) {
          logger.error('Failure while recording campaign progress', error);
        } finally {
          logger.debug('Campaign progress recording finished');
        }
      },
    );
  }

  async checkCampaignProgressForPeriod(
    campaign: CampaignEntity,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignProgress<CampaignProgressMeta>> {
    const logger = this.logger.child({
      action: 'checkCampaignProgressForPeriod',
      caller: debugUtils.getCaller(),
      campaignId: campaign.id,
      chainId: campaign.chainId,
      campaignAddress: campaign.address,
      exchangeName: campaign.exchangeName,
      startDate,
      endDate,
    });

    const campaignProgressChecker = this.getCampaignProgressChecker(
      campaign.type,
      {
        exchangeName: campaign.exchangeName,
        symbol: campaign.symbol,
        periodStart: startDate,
        periodEnd: endDate,
      },
    );

    const participants =
      await this.userCampaignsRepository.findCampaignParticipants(campaign.id);

    const outcomes: ParticipantOutcome[] = [];
    for (const participant of participants) {
      let exchangeApiKey: ExchangeApiKeyData;
      try {
        exchangeApiKey = await this.exchangeApiKeysService.retrieve(
          participant.id,
          campaign.exchangeName,
        );
      } catch (error) {
        if (error instanceof ExchangeApiKeyNotFoundError) {
          /**
           * We should remove all active participations before
           * allowing to remove api key, but let's warn ourselves
           * just in case if something unusual happens.
           */
          logger.warn('Participant lacks valid api key', {
            participantId: participant.id,
          });
          continue;
        }
        throw error;
      }

      try {
        const { abuseDetected, ...participantOutcomes } =
          await campaignProgressChecker.checkForParticipant(
            {
              apiKey: exchangeApiKey.apiKey,
              secret: exchangeApiKey.secretKey,
            },
            participant.joinedAt,
          );

        if (abuseDetected) {
          logger.warn('Abuse detected. Skipping participant outcome', {
            participantId: participant.id,
          });
          continue;
        }

        outcomes.push({
          address: participant.evmAddress,
          ...participantOutcomes,
        });
      } catch (error) {
        if (error instanceof ExchangeApiAccessError) {
          logger.warn('Participant lacks necessary exchange API access', {
            participantId: participant.id,
            error,
          });
          continue;
        }

        throw error;
      }
    }

    return {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      participants_outcomes: outcomes,
      meta: campaignProgressChecker.getCollectedMeta(),
    };
  }

  private getCampaignProgressChecker(
    campaignType: string,
    campaignCheckerSetup: CampaignProgressCheckerSetup,
  ): CampaignProgressChecker<ProgressCheckResult, CampaignProgressMeta> {
    const exchangeApiClientFactory = this.moduleRef.get(
      ExchangeApiClientFactory,
      { strict: false },
    );

    switch (campaignType) {
      case CampaignType.MARKET_MAKING:
        return new MarketMakingProgressChecker(
          exchangeApiClientFactory,
          campaignCheckerSetup,
        );
      case CampaignType.HOLDING:
        return new HoldingProgressChecker(
          exchangeApiClientFactory,
          campaignCheckerSetup,
        );
      default:
        throw new Error(`No progress checker for ${campaignType} campaign`);
    }
  }

  private async retrieveCampaignIntermediateResults(
    campaign: CampaignEntity,
  ): Promise<IntermediateResultsData | null> {
    const signer = this.web3Service.getSigner(campaign.chainId);
    const escrowClient = await EscrowClient.build(signer);
    const intermediateResultsUrl = await escrowClient.getIntermediateResultsUrl(
      campaign.address,
    );
    if (!intermediateResultsUrl) {
      return null;
    }

    const intermediateResults = await httpUtils.downloadFile(
      intermediateResultsUrl,
    );

    return JSON.parse(intermediateResults.toString());
  }

  calculateDailyReward(campaign: CampaignEntity): number {
    const campaignDurationDays = Math.ceil(
      dayjs(campaign.endDate).diff(campaign.startDate, 'days', true),
    );

    const fundAmount = Number(campaign.fundAmount);

    const dailyReward = decimalUtils.div(fundAmount, campaignDurationDays);

    const truncatedDailyReward = decimalUtils.truncate(
      dailyReward,
      campaign.fundTokenDecimals,
    );

    return truncatedDailyReward;
  }

  calculateRewardPool(input: {
    maxRewardPool: number;
    progressValueTarget: number;
    progressValue: number;
    fundTokenDecimals: number;
  }): number {
    const rewardRatio = Math.min(
      input.progressValue / input.progressValueTarget,
      1,
    );

    const rewardPool = rewardRatio * input.maxRewardPool;

    const truncatedRewardPool = decimalUtils.truncate(
      rewardPool,
      input.fundTokenDecimals,
    );

    return truncatedRewardPool;
  }

  private async recordCampaignIntermediateResults(
    intermediateResults: IntermediateResultsData,
  ): Promise<{ url: string; hash: string }> {
    const chainId = intermediateResults.chain_id;
    const campaignAddress = intermediateResults.address;

    const stringifiedResults = JSON.stringify(intermediateResults);
    const resultsHash = crypto
      .createHash('sha256')
      .update(stringifiedResults)
      .digest('hex');

    const fileName = `${campaignAddress}/${resultsHash}.json`;

    const resultsUrl = await this.storageService.uploadData(
      stringifiedResults,
      fileName,
      ContentType.JSON,
    );

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const gasPrice = await this.web3Service.calculateGasPrice(chainId);

    await escrowClient.storeResults(campaignAddress, resultsUrl, resultsHash, {
      gasPrice,
    });

    return { url: resultsUrl, hash: resultsHash };
  }

  private async recordGeneratedVolume(
    campaign: CampaignEntity,
    intermediateResult: IntermediateResult,
  ): Promise<void> {
    try {
      const [_baseTokenSymbol, quoteTokenSymbol] = campaign.symbol.split('/');

      const quoteTokenPriceUsd =
        await this.web3Service.getTokenPriceUsd(quoteTokenSymbol);

      if (!quoteTokenPriceUsd) {
        return;
      }

      const volumeUsd =
        (intermediateResult.total_volume as number) * quoteTokenPriceUsd;

      await this.volumeStatsRepository.upsert(
        {
          exchangeName: campaign.exchangeName,
          campaignAddress: campaign.address,
          periodStart: new Date(intermediateResult.from),
          periodEnd: new Date(intermediateResult.to),
          volume: (intermediateResult.total_volume as number).toString(),
          volumeUsd: volumeUsd.toString(),
        },
        ['exchangeName', 'campaignAddress', 'periodStart'],
      );
    } catch {
      // noop
    }
  }

  @Cron(CAMPAIGNS_FINISH_TRACKING_SCHEDULE)
  async trackCampaignsFinish(): Promise<void> {
    this.logger.debug('Campaigns finish tracking job started');

    try {
      const campaignsToTrack =
        await this.campaignsRepository.findForFinishTracking();

      for (const campaign of campaignsToTrack) {
        const escrow = await EscrowUtils.getEscrow(
          campaign.chainId,
          campaign.address,
        );

        if (escrow.status === EscrowStatus[EscrowStatus.Complete]) {
          this.logger.info('Marking campaign as completed', {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          });
          campaign.status = CampaignStatus.COMPLETED;
          await this.campaignsRepository.save(campaign);
        } else if (escrow.status === EscrowStatus[EscrowStatus.Cancelled]) {
          this.logger.info('Marking campaign as cancelled', {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          });
          campaign.status = CampaignStatus.CANCELLED;
          await this.campaignsRepository.save(campaign);
        }
      }
    } catch (error) {
      this.logger.error('Error while tracking campaigns finish', error);
    }

    this.logger.debug('Campaigns finish tracking job finished');
  }

  async checkUserJoined(
    userId: string,
    chainId: number,
    campaignAddress: string,
  ): Promise<boolean> {
    const campaign = await this.findOneByChainIdAndAddress(
      chainId,
      campaignAddress,
    );
    if (!campaign) {
      return false;
    }

    const isUserJoined =
      await this.userCampaignsRepository.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    return isUserJoined;
  }

  async getUserProgress(
    userId: string,
    evmAddress: string,
    chainId: number,
    campaignAddress: string,
  ) {
    const campaign = await this.findOneByChainIdAndAddress(
      chainId,
      campaignAddress,
    );
    if (!campaign) {
      throw new CampaignNotFoundError(chainId, campaignAddress);
    }

    const now = new Date();
    if (now < campaign.startDate) {
      throw new CampaignNotStartedError(chainId, campaignAddress);
    }
    if (now > campaign.endDate) {
      throw new CampaignAlreadyFinishedError(chainId, campaignAddress);
    }

    const isUserJoined =
      await this.userCampaignsRepository.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    if (!isUserJoined) {
      throw new UserIsNotParticipatingError();
    }

    // Calculate start of the active timeframe (end is now)
    const timeframesPassed = dayjs(now).diff(campaign.startDate, 'day');

    const timeframeStart = dayjs(campaign.startDate)
      .add(timeframesPassed, 'day')
      .toDate();

    /**
     * Using timeframeStart in a key to prevent situations
     * where new timeframe has started but cached value is not expired yet
     */
    const cacheKey = `${campaign.chainId}-${campaign.address}-${timeframeStart}`;

    if (!campaignsProgressCache.has(cacheKey)) {
      const progress = await this.checkCampaignProgressForPeriod(
        campaign,
        timeframeStart,
        now,
      );

      campaignsProgressCache.set(cacheKey, {
        from: progress.from,
        to: progress.to,
        meta: progress.meta,
        participants_outcomes: progress.participants_outcomes,
      });
    }

    const progress = campaignsProgressCache.get(
      cacheKey,
    ) as CampaignProgress<CampaignProgressMeta>;
    const {
      score: myScore,
      address: _address,
      ...myMeta
    } = progress.participants_outcomes.find(
      (p) => p.address === evmAddress,
    ) || {
      score: 0,
    };

    return {
      from: progress.from,
      to: progress.to,
      myScore,
      myMeta,
      totalMeta: progress.meta,
    };
  }

  @Cron(NEW_CAMPAIGNS_DISCOVERY_SCHEDULE)
  async discoverNewCampaigns(): Promise<void> {
    this.logger.debug('New campaigns discovery job started');

    for (const chainId of this.web3Service.supportedChainIds) {
      try {
        const latestKnownCampaign =
          await this.campaignsRepository.findLatestCampaignForChain(chainId);
        let lookbackDate: Date;
        if (latestKnownCampaign) {
          const campaignEscrow = await EscrowUtils.getEscrow(
            latestKnownCampaign.chainId,
            latestKnownCampaign.address,
          );
          /**
           * 'createdAt' is a tx block timestamp, so technically
           * there might be multiple escrows created within the same block
           * and we have to discover from the same timstamp value to not miss some.
           */
          const lookbackTimestamp = Number(campaignEscrow.createdAt) * 1000;
          lookbackDate = new Date(lookbackTimestamp);
        } else {
          lookbackDate = dayjs().subtract(1, 'day').toDate();
        }

        const newEscrows = await EscrowUtils.getEscrows({
          chainId: chainId as number,
          recordingOracle: this.web3ConfigService.operatorAddress,
          status: EscrowStatus.Pending,
          from: lookbackDate,
          orderDirection: OrderDirection.ASC,
          first: 10,
        });
        this.logger.debug('Discovered new launched campaigns', {
          chainId,
          campaigns: newEscrows.map((e) => e.address),
        });

        for (const newEscrow of newEscrows) {
          const campaignAddress = ethers.getAddress(newEscrow.address);
          const campaignExists =
            await this.campaignsRepository.checkCampaignExists(
              chainId as number,
              campaignAddress,
            );
          if (campaignExists) {
            this.logger.debug('Discovered campaign already exists; skip it', {
              chainId,
              campaignAddress,
            });
            continue;
          }

          try {
            const { manifest, escrowInfo } = await this.retrieveCampaignData(
              chainId,
              campaignAddress,
            );

            const createdCampaign = await this.createCampaign(
              chainId,
              campaignAddress,
              manifest,
              escrowInfo,
            );
            this.logger.info('Discovered and created new campaign', {
              chainId,
              campaignAddress,
              campaignId: createdCampaign.id,
            });
          } catch (error) {
            if (error instanceof InvalidCampaign) {
              this.logger.warn('Discovered campaign is not valid; skip it', {
                chainId,
                campaignAddress,
                error,
              });
              continue;
            } else {
              this.logger.warn('Failed to save discovered campaign', {
                chainId,
                campaignAddress,
                error,
              });
              throw new Error('Failed to save campaign');
            }
          }
        }
      } catch (error) {
        this.logger.error('Error while discovering new campaigns for chain', {
          chainId,
          error,
        });
      }
    }

    this.logger.debug('New campaigns discovery job finished');
  }
}
