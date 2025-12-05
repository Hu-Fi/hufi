import crypto from 'crypto';

import {
  ESCROW_BULK_PAYOUT_MAX_ITEMS,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  OrderDirection,
} from '@human-protocol/sdk';
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  Cron,
  CronExpression,
  Interval as ScheduleInterval,
  SchedulerRegistry,
} from '@nestjs/schedule';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import _ from 'lodash';
import { LRUCache } from 'lru-cache';

import { ContentType } from '@/common/enums';
import * as debugUtils from '@/common/utils/debug';
import * as escrowUtils from '@/common/utils/escrow';
import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import * as web3Utils from '@/common/utils/web3';
import { isValidExchangeName } from '@/common/validators';
import { CampaignsConfigService, Web3ConfigService } from '@/config';
import logger from '@/logger';
import {
  ExchangesService,
  ExchangeApiAccessError,
  ExchangeApiKeyNotFoundError,
} from '@/modules/exchanges';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import { CampaignEntity } from './campaign.entity';
import {
  CampaignAlreadyFinishedError,
  CampaignCancelledError,
  CampaignJoinLimitedError,
  CampaignNotFoundError,
  CampaignNotStartedError,
  InvalidCampaign,
  UserIsNotParticipatingError,
} from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import {
  CAMPAIGN_PERMISSIONS_MAP,
  CampaignServiceJob,
  PROGRESS_PERIOD_DAYS,
} from './constants';
import * as manifestUtils from './manifest.utils';
import {
  type CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  CampaignProgressMeta,
  HoldingProgressChecker,
  MarketMakingProgressChecker,
  ProgressCheckResult,
  ThresholdProgressChecker,
} from './progress-checking';
import { HoldingMeta } from './progress-checking/holding';
import { MarketMakingMeta } from './progress-checking/market-making';
import { ThresholdMeta } from './progress-checking/threshold';
import {
  isHoldingCampaign,
  isMarketMakingCampaign,
  isThresholdCampaign,
} from './type-guards';
import {
  CampaignEscrowInfo,
  CampaignManifest,
  CampaignManifestBase,
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  CampaignJoinStatus,
  IntermediateResult,
  IntermediateResultsData,
  ParticipantOutcome,
} from './types';
import { UserCampaignEntity } from './user-campaign.entity';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatsRepository } from './volume-stats.repository';

@Injectable()
export class CampaignsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = logger.child({
    context: CampaignsService.name,
  });

  private readonly campaignsInterimProgressCache = new LRUCache<
    string,
    CampaignProgress<CampaignProgressMeta>
  >({
    // expect not more than 100 active campaings atm
    max: 100,
  });

  constructor(
    private readonly campaignsConfigService: CampaignsConfigService,
    private readonly campaignsRepository: CampaignsRepository,
    private readonly exchangesService: ExchangesService,
    private readonly userCampaignsRepository: UserCampaignsRepository,
    private readonly storageService: StorageService,
    private readonly volumeStatsRepository: VolumeStatsRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly pgAdvisoryLock: PgAdvisoryLock,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap() {
    void this.refreshInterimProgressCache();
  }

  async onModuleDestroy(): Promise<void> {
    for (const [jobName, jobRef] of this.schedulerRegistry.getCronJobs()) {
      if (jobRef.isCallbackRunning) {
        this.logger.warn('Campaign service job is running while shutdown', {
          jobName,
        });
      }
    }
  }

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

    const userJoinedAt =
      await this.userCampaignsRepository.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    if (userJoinedAt) {
      return campaign.id;
    }

    /**
     * After campaign is created, escrows can be manipulated
     * directly on blockchain (e.g. by admin), plus we have replication lag,
     * so we have to do a live-check here and in other similar places
     * where we are sensitive to escrow status
     */
    const signer = this.web3Service.getSigner(campaign.chainId);
    const escrowClient = await EscrowClient.build(signer);
    const escrowStatus = await escrowClient.getStatus(campaign.address);
    if (
      [EscrowStatus.ToCancel, EscrowStatus.Cancelled].includes(escrowStatus)
    ) {
      throw new CampaignCancelledError(campaign.chainId, campaign.address);
    }
    if (
      escrowStatus === EscrowStatus.Complete ||
      campaign.endDate.valueOf() <= Date.now()
    ) {
      throw new CampaignAlreadyFinishedError(
        campaign.chainId,
        campaign.address,
      );
    }

    if (this.checkCampaignTargetMet(campaign)) {
      throw new CampaignJoinLimitedError(
        campaign.chainId,
        campaign.address,
        'Target is met',
      );
    }

    await this.exchangesService.assertUserHasAuthorizedKeys(
      userId,
      campaign.exchangeName,
      CAMPAIGN_PERMISSIONS_MAP[campaign.type],
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
    newCampaign.resultsCutoffAt = null;

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
        'Invalid fund amount',
      );
    }
    if (!escrow.manifest || !escrow.manifestHash) {
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
      [
        EscrowStatus.ToCancel,
        EscrowStatus.Cancelled,
        EscrowStatus.Complete,
      ].includes(escrowStatus)
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
          escrow.manifest,
          escrow.manifestHash,
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
      manifestString = escrow.manifest;
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
        case CampaignType.THRESHOLD:
          manifestUtils.assertValidThresholdCampaignManifest(manifest);
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

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: CampaignServiceJob.RECORD_CAMPAIGNS_PROGRESS,
    waitForCompletion: true,
  })
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
        const hasProcessableStatus = [
          CampaignStatus.ACTIVE,
          CampaignStatus.TO_CANCEL,
        ].includes(campaign.status);
        if (!hasProcessableStatus) {
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
          const signer = this.web3Service.getSigner(campaign.chainId);
          const escrowClient = await EscrowClient.build(signer);
          const escrowStatus = await escrowClient.getStatus(campaign.address);
          /**
           * Safety-belt for case when tracking job
           * has not finished this campaign yet, but
           * it's already finished on blockchain
           */
          if (
            [EscrowStatus.Complete, EscrowStatus.Cancelled].includes(
              escrowStatus,
            )
          ) {
            logger.warn('Campaign finished, skipping progress recording');
            return;
          }

          if (campaign.startDate >= new Date()) {
            logger.warn('Campaign not started, skipping progress recording');
            return;
          }

          let intermediateResults =
            await this.retrieveCampaignIntermediateResults(campaign);
          if (!intermediateResults) {
            intermediateResults = {
              chain_id: campaign.chainId,
              address: campaign.address,
              exchange: campaign.exchangeName,
              symbol: campaign.symbol,
              results: [],
            };
          }

          let startDate = campaign.startDate;
          if (intermediateResults.results.length > 0) {
            const { to: lastResultAt } = intermediateResults.results.at(
              -1,
            ) as IntermediateResult;

            const lastResultDate = new Date(lastResultAt);
            /**
             * Add 1 ms to end date because interval boundaries are inclusive
             */
            startDate = new Date(lastResultDate.valueOf() + 1);
          }

          let endDate: Date;
          if (escrowStatus === EscrowStatus.ToCancel) {
            const cancellationRequestedAt =
              await escrowUtils.getCancellationRequestDate(
                campaign.chainId,
                campaign.address,
              );
            endDate = cancellationRequestedAt;
          } else {
            endDate = dayjs(startDate)
              .add(PROGRESS_PERIOD_DAYS, 'day')
              .toDate();

            const isOngoingCampaign = campaign.endDate.valueOf() > Date.now();
            if (isOngoingCampaign && endDate.valueOf() > Date.now()) {
              /**
               * If campaign is ongoing - check results only once per period.
               * Otherwise - let it record results immediately to reduce the wait.
               */
              logger.warn(
                "Can't check progress for period that is not finished yet",
                {
                  startDate,
                  endDate,
                },
              );
              return;
            }
          }

          if (endDate > campaign.endDate) {
            endDate = campaign.endDate;
          }

          // safety-belt
          if (startDate >= endDate) {
            logger.warn('Campaign progress period dates overlap', {
              startDate,
              endDate,
              escrowStatus,
              escrowStatusString: EscrowStatus[escrowStatus],
            });
            if (escrowStatus === EscrowStatus.ToCancel) {
              /**
               * This can happen when:
               * - campaign cancelled before it reached start_date from manifest
               * - if we processed results and stored them for 'ToCancel' campaign,
               * but failed to update internal status to exclude it from further processing
               */
              campaign.status = CampaignStatus.PENDING_CANCELLATION;
              campaign.lastResultsAt = new Date();
              campaign.resultsCutoffAt = endDate;
              await this.campaignsRepository.save(campaign);
              return;
            } else {
              /**
               * This can happen only in situations when:
               * - by some reason we lost data about campaign from DB, then re-added it
               * - by some reason campaign was 'pending_completion'/'completed', but status changed to 'active'
               *
               * and then attempted to record it's progress but it must be
               * already finished and start-end dates overlap indicates that,
               * so just mark it as pending_completion, otherwise it leads to invalid intermediate results.
               */
              campaign.status = CampaignStatus.PENDING_COMPLETION;
              campaign.lastResultsAt = new Date();
              campaign.resultsCutoffAt = endDate;
              await this.campaignsRepository.save(campaign);
              return;
            }
          }

          const progress = await this.checkCampaignProgressForPeriod(
            campaign,
            startDate,
            endDate,
            { logWarnings: true },
          );

          let progressValueTarget: number;
          let progressValue: number;
          if (isMarketMakingCampaign(campaign)) {
            progressValueTarget = campaign.details.dailyVolumeTarget;
            progressValue = (progress.meta as MarketMakingMeta).total_volume;
          } else if (isHoldingCampaign(campaign)) {
            progressValueTarget = campaign.details.dailyBalanceTarget;
            progressValue = (progress.meta as HoldingMeta).total_balance;
          } else if (isThresholdCampaign(campaign)) {
            /**
             * We are going to distribute daily reward pool fully in case there is at least one participant eligible for the reward.
             * This is why we're using hardcoded 1 as a progressValueTarget and total_score instead of a balance for the progressValue.
             * */
            progressValueTarget = 1;
            // TODO: Check this logic before releasing new contracts
            progressValue = (progress.meta as ThresholdMeta).total_score;
          } else {
            throw new Error(
              `Unknown campaign type for reward pool calculation: ${campaign.type}`,
            );
          }

          let periodDurationDays = PROGRESS_PERIOD_DAYS;
          if (escrowStatus === EscrowStatus.ToCancel) {
            periodDurationDays = Math.ceil(
              dayjs(endDate).diff(startDate, 'days', true),
            );
          }
          const rewardPool = this.calculateRewardPool({
            baseRewardPool: this.calculateDailyReward(campaign),
            maxRewardPoolRatio: periodDurationDays,
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
          const fundsToReserve = ethers.parseUnits(
            rewardPool.toString(),
            campaign.fundTokenDecimals,
          );

          logger.info('Going to record campaign progress', {
            from: progress.from,
            to: progress.to,
            reserved_funds: rewardPool,
          });

          const storedResultsMeta =
            await this.recordCampaignIntermediateResults(
              intermediateResults,
              fundsToReserve,
            );

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

          if (escrowStatus === EscrowStatus.ToCancel) {
            campaign.status = CampaignStatus.PENDING_CANCELLATION;
          } else if (endDate.valueOf() === campaign.endDate.valueOf()) {
            /**
             * There might be situations when due to delays/failures in processing
             * we reach campaign end date but still have periods to process,
             * so mark campaign as pending completion only if results recorded for all periods,
             * otherwise keep it as is to wait for all periods to be recorded.
             */
            campaign.status = CampaignStatus.PENDING_COMPLETION;
          }

          campaign.lastResultsAt = new Date();
          campaign.resultsCutoffAt = endDate;
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
    options: { logWarnings?: boolean } = {},
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
        ...campaign.details,
      },
    );

    const participants =
      await this.userCampaignsRepository.findCampaignParticipants(campaign.id);

    const outcomes: ParticipantOutcome[] = [];
    for (const participant of participants) {
      try {
        const { abuseDetected, ...participantOutcomes } =
          await campaignProgressChecker.checkForParticipant(participant);

        if (abuseDetected) {
          if (options.logWarnings) {
            logger.warn('Abuse detected. Skipping participant outcome', {
              participantId: participant.id,
            });
          }
          continue;
        }

        outcomes.push({
          address: participant.evmAddress,
          ...participantOutcomes,
        });
      } catch (error) {
        /**
         * We should remove all active participations before
         * allowing to remove api key, but let's warn ourselves
         * just in case if something unusual happens.
         */
        if (error instanceof ExchangeApiKeyNotFoundError) {
          if (options.logWarnings) {
            logger.warn('Participant api key not found', {
              participantId: participant.id,
              error,
            });
          }
          continue;
        }

        if (error instanceof ExchangeApiAccessError) {
          if (options.logWarnings) {
            logger.warn('Exchange access failed for provided api key', {
              participantId: participant.id,
              error,
            });
          }
          void this.exchangesService.revalidateApiKey(
            participant.id,
            campaign.exchangeName,
          );
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
    switch (campaignType) {
      case CampaignType.MARKET_MAKING:
        return new MarketMakingProgressChecker(
          this.exchangesService,
          campaignCheckerSetup,
        );
      case CampaignType.HOLDING:
        return new HoldingProgressChecker(
          this.exchangesService,
          campaignCheckerSetup,
        );
      case CampaignType.THRESHOLD:
        return new ThresholdProgressChecker(
          this.exchangesService,
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

  calculateDailyReward(campaign: CampaignEntity): string {
    const campaignDurationDays = Math.ceil(
      dayjs(campaign.endDate).diff(campaign.startDate, 'days', true),
    );

    const fundAmount = new Decimal(campaign.fundAmount);

    const dailyReward = fundAmount.div(campaignDurationDays);

    return dailyReward
      .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
      .toString();
  }

  calculateRewardPool(input: {
    baseRewardPool: string;
    maxRewardPoolRatio: number;
    progressValueTarget: number;
    progressValue: number;
    fundTokenDecimals: number;
  }): string {
    const rewardRatio = Math.min(
      input.progressValue / input.progressValueTarget,
      input.maxRewardPoolRatio,
    );

    const baseRewardPool = new Decimal(input.baseRewardPool);
    const rewardPool = baseRewardPool.mul(rewardRatio);

    return rewardPool
      .toDecimalPlaces(input.fundTokenDecimals, Decimal.ROUND_DOWN)
      .toString();
  }

  private async recordCampaignIntermediateResults(
    intermediateResults: IntermediateResultsData,
    fundsToReserve: bigint,
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

    const latestNonce = await signer.getNonce('latest');

    await escrowClient.storeResults(
      campaignAddress,
      resultsUrl,
      resultsHash,
      fundsToReserve,
      {
        gasPrice,
        nonce: latestNonce,
      },
    );

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

  @ScheduleInterval(
    CampaignServiceJob.SYNC_CAMPAIGN_STATUSES,
    dayjs.duration(3, 'minutes').asMilliseconds(),
  )
  async syncCampaignStatuses(): Promise<void> {
    this.logger.debug('Campaign statuses sync job started');

    try {
      const campaignsToSync =
        await this.campaignsRepository.findForStatusSync();

      for (const campaign of campaignsToSync) {
        const escrow = await EscrowUtils.getEscrow(
          campaign.chainId,
          campaign.address,
        );
        if (!escrow) {
          this.logger.error('Escrow data is missing for campaign', {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          });
          continue;
        }

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
        } else if (
          escrow.status === EscrowStatus[EscrowStatus.ToCancel] &&
          campaign.status === CampaignStatus.ACTIVE
        ) {
          this.logger.info('Marking campaign as to_cancel', {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          });
          campaign.status = CampaignStatus.TO_CANCEL;
          await this.campaignsRepository.save(campaign);
        }
      }
    } catch (error) {
      this.logger.error('Error while syncing campaign statuses', error);
    }

    this.logger.debug('Campaign statuses sync job finished');
  }

  async checkJoinStatus(
    userId: string,
    chainId: number,
    campaignAddress: string,
  ): Promise<
    | { status: CampaignJoinStatus.USER_ALREADY_JOINED; joinedAt: string }
    | { status: CampaignJoinStatus.JOIN_IS_CLOSED; reason: string }
    | {
        status:
          | CampaignJoinStatus.NOT_AVAILABLE
          | CampaignJoinStatus.USER_CAN_JOIN;
      }
  > {
    const campaign = await this.findOneByChainIdAndAddress(
      chainId,
      campaignAddress,
    );
    if (!campaign) {
      return {
        status: CampaignJoinStatus.NOT_AVAILABLE,
      };
    }

    const userJoinedAt =
      await this.userCampaignsRepository.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    if (userJoinedAt) {
      return {
        status: CampaignJoinStatus.USER_ALREADY_JOINED,
        joinedAt: userJoinedAt,
      };
    }

    if (
      campaign.endDate.valueOf() <= Date.now() ||
      campaign.status !== CampaignStatus.ACTIVE
    ) {
      return {
        status: CampaignJoinStatus.JOIN_IS_CLOSED,
        reason: 'ended',
      };
    }

    const isCampaignTargetMet = this.checkCampaignTargetMet(campaign);
    if (isCampaignTargetMet) {
      return {
        status: CampaignJoinStatus.JOIN_IS_CLOSED,
        reason: 'target_met',
      };
    }

    return {
      status: CampaignJoinStatus.USER_CAN_JOIN,
    };
  }

  async getUserProgress(
    userId: string,
    evmAddress: string,
    chainId: number,
    campaignAddress: string,
  ): Promise<{
    from: string;
    to: string;
    myScore: number;
    myMeta: Record<string, unknown>;
    totalMeta: Record<string, unknown>;
  } | null> {
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

    if (
      [
        CampaignStatus.PENDING_CANCELLATION,
        CampaignStatus.CANCELLED,
        CampaignStatus.COMPLETED,
      ].includes(campaign.status) ||
      now > campaign.endDate
    ) {
      throw new CampaignAlreadyFinishedError(chainId, campaignAddress);
    }

    const userJoinedAt =
      await this.userCampaignsRepository.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    if (!userJoinedAt) {
      throw new UserIsNotParticipatingError();
    }

    const activeTimeframe = await this.getActiveTimeframe(campaign);
    if (!activeTimeframe) {
      throw new InvalidCampaign(
        campaign.chainId,
        campaign.address,
        "Couldn't get active timeframe",
      );
    }

    const progress = this.campaignsInterimProgressCache.get(campaign.id);
    if (progress?.from !== activeTimeframe.start.toISOString()) {
      /**
       * Either no progress cached yet or cached for previous timeframe
       */
      return null;
    }

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

  @ScheduleInterval(
    CampaignServiceJob.DISCOVER_NEW_CAMPAIGNS,
    dayjs.duration(10, 'minutes').asMilliseconds(),
  )
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
          if (!campaignEscrow) {
            throw new Error('No escrow data for latest known campaign');
          }
          /**
           * 'createdAt' is a tx block timestamp, so technically
           * there might be multiple escrows created within the same block
           * and we have to discover from the same timestamp value to not miss some.
           */
          lookbackDate = new Date(campaignEscrow.createdAt);
        } else {
          lookbackDate = dayjs().subtract(1, 'day').toDate();
        }

        const newEscrows = await EscrowUtils.getEscrows({
          chainId: chainId as number,
          recordingOracle: this.web3ConfigService.operatorAddress,
          /**
           * We are interested only in pending escrows, because if it's in `ToCancel`
           * status and not in RecO DB yet - it means nobody joined and no need to process it
           */
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

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: CampaignServiceJob.REFRESH_INTERIM_PROGRESS_CACHE,
    waitForCompletion: true,
  })
  async refreshInterimProgressCache(): Promise<void> {
    await this.pgAdvisoryLock.withLock(
      'refresh-interim-progress-cache',
      async () => {
        this.logger.debug('Refresh interim progress cache job started');

        try {
          /**
           * Atm we don't expect many active campaigns
           * so it's fine to get all at once, but later
           * we might need to query them in batches or as stream.
           */
          const campaignsToRefresh =
            await this.campaignsRepository.findOngoingCampaigns();

          for (const campaign of campaignsToRefresh) {
            /**
             * Right now for simplicity process sequentially.
             * Later we can add "fastq" usage for parallel processing
             * and "backpressured" adding to the queue.
             */
            const campaignLogger = logger.child({
              campaignId: campaign.id,
              chainId: campaign.chainId,
              campaignAddress: campaign.address,
            });
            const isCampaignEndingSoon = dayjs()
              .add(5, 'minute')
              .isSameOrAfter(campaign.endDate);
            if (isCampaignEndingSoon) {
              campaignLogger.debug(
                'Campaign ends soon, skip interim progress cache refresh',
              );
              continue;
            }

            try {
              const timeframe = await this.getActiveTimeframe(campaign);
              if (!timeframe) {
                campaignLogger.debug(
                  'No active timeframe, skip interim progress cache refresh',
                );
                continue;
              }
              const progress = await this.checkCampaignProgressForPeriod(
                campaign,
                timeframe.start,
                timeframe.end,
              );
              this.campaignsInterimProgressCache.set(campaign.id, progress);
            } catch (error) {
              campaignLogger.error(
                'Failed to get interim progress for campaign',
                {
                  error,
                },
              );
            }
          }
        } catch (error) {
          this.logger.error(
            'Error while refreshing interim progress cache',
            error,
          );
        }

        this.logger.debug('Refresh interim progress cache job finished');
      },
    );
  }

  async getActiveTimeframe(campaign: CampaignEntity): Promise<{
    start: Date;
    end: Date;
  } | null> {
    const now = new Date();
    if (now < campaign.startDate) {
      // campaign not started yet - no active timeframe
      return null;
    }

    if (
      [
        CampaignStatus.PENDING_CANCELLATION,
        CampaignStatus.CANCELLED,
        CampaignStatus.COMPLETED,
      ].includes(campaign.status) ||
      now > campaign.endDate
    ) {
      // campaign already finished - no active timeframe
      return null;
    }

    // Calculate start of the active timeframe (end is now)
    const timeframesPassed = Math.floor(
      dayjs(now).diff(campaign.startDate, 'day', false) / PROGRESS_PERIOD_DAYS,
    );

    const timeframeStart = dayjs(campaign.startDate)
      .add(timeframesPassed * PROGRESS_PERIOD_DAYS, 'day')
      .add(1, 'millisecond')
      .toDate();

    let timeframeEnd: Date;
    if (campaign.status === CampaignStatus.TO_CANCEL) {
      const cancellationRequestedAt =
        await escrowUtils.getCancellationRequestDate(
          campaign.chainId,
          campaign.address,
        );
      if (cancellationRequestedAt <= timeframeStart) {
        // cancellation requested earlier than current timeframe - no active timeframe
        return null;
      }
      timeframeEnd = cancellationRequestedAt;
    } else {
      timeframeEnd = now;
    }

    return {
      start: timeframeStart,
      end: timeframeEnd,
    };
  }

  checkCampaignTargetMet(campaign: CampaignEntity): boolean {
    if (!isHoldingCampaign(campaign)) {
      return false;
    }

    if (!this.campaignsConfigService.isHoldingJoinLimitEnabled) {
      return false;
    }

    const campaignProgress = this.campaignsInterimProgressCache.get(
      campaign.id,
    ) as CampaignProgress<HoldingMeta> | undefined;
    if (!campaignProgress) {
      return false;
    }

    const isDailyBalanceTargetMet =
      campaignProgress.meta.total_balance >=
      campaign.details.dailyBalanceTarget;

    return isDailyBalanceTargetMet;
  }
}
