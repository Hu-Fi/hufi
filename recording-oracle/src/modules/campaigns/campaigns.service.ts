import crypto from 'crypto';

import {
  ESCROW_BULK_PAYOUT_MAX_ITEMS,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  OrderDirection,
} from '@human-protocol/sdk';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  Cron,
  CronExpression,
  Interval as ScheduleInterval,
  SchedulerRegistry,
} from '@nestjs/schedule';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import _ from 'lodash';
import { LRUCache } from 'lru-cache';
import ms from 'ms';

import { ExchangeName } from '@/common/constants';
import { ContentType } from '@/common/enums';
import { ExchangeNotSupportedError } from '@/common/errors/exchanges';
import * as debugUtils from '@/common/utils/debug';
import * as escrowUtils from '@/common/utils/escrow';
import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { isFiniteNumber, toError } from '@/common/utils/type-guard';
import * as web3Utils from '@/common/utils/web3';
import {
  CampaignsConfigService,
  ExchangesConfigService,
  Web3ConfigService,
} from '@/config';
import logger from '@/logger';
import {
  ExchangeApiAccessError,
  ExchangeApiClientFactory,
  ExchangeApiKeyNotFoundError,
  ExchangesService,
  type PancakeswapClient,
} from '@/modules/exchanges';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import { CampaignEntity } from './campaign.entity';
import { CampaignsCache } from './campaigns-cache';
import { LeaderboardEntry } from './campaigns.dto';
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
  CAMPAIGNS_DAILY_CYCLE,
} from './constants';
import * as manifestUtils from './manifest.utils';
import {
  ParticipationsRepository,
  ParticipationsService,
  UserAlreadyJoinedError,
} from './participations';
import {
  CampaignProgressCheckerSetup,
  CampaignProgressMeta,
  HoldingProgressChecker,
  MarketMakingProgressChecker,
  ProgressCheckResult,
  ThresholdProgressChecker,
  type CampaignProgressChecker,
  type HoldingMeta,
} from './progress-checking';
import * as rewardsUtils from './rewards.utils';
import {
  isCompetitiveMarketMakingCampaign,
  isHoldingCampaign,
  isMarketMakingCampaign,
  isThresholdCampaign,
} from './type-guards';
import {
  CampaignEscrowInfo,
  CampaignJoinStatus,
  CampaignManifest,
  CampaignManifestBase,
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  IntermediateResult,
  IntermediateResultsData,
  ParticipantOutcome,
} from './types';
import { VolumeStatsRepository } from './volume-stats.repository';

@Injectable()
export class CampaignsService implements OnModuleDestroy {
  private readonly logger = logger.child({
    context: CampaignsService.name,
  });

  private readonly prefinalResultsCache = new LRUCache<
    string,
    IntermediateResultsData
  >({ max: 100 });

  constructor(
    private readonly campaignsCache: CampaignsCache,
    private readonly campaignsConfigService: CampaignsConfigService,
    private readonly campaignsRepository: CampaignsRepository,
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
    private readonly exchangesConfigService: ExchangesConfigService,
    private readonly exchangesService: ExchangesService,
    private readonly participationsRepository: ParticipationsRepository,
    private readonly participationsService: ParticipationsService,
    private readonly storageService: StorageService,
    private readonly volumeStatsRepository: VolumeStatsRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly pgAdvisoryLock: PgAdvisoryLock,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

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
      await this.participationsService.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    if (userJoinedAt) {
      throw new UserAlreadyJoinedError(campaign.id, userId);
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

    const isCampaignTargetMet = await this.checkCampaignTargetMet(campaign);
    if (isCampaignTargetMet) {
      throw new CampaignJoinLimitedError(
        campaign.chainId,
        campaign.address,
        'Target is met.',
      );
    }

    await this.exchangesService.assertUserHasRequiredAccess(
      userId,
      campaign.exchangeName as ExchangeName,
      CAMPAIGN_PERMISSIONS_MAP[campaign.type],
    );

    await this.participationsService.joinCampaign(userId, campaign);

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

  private assertCorrectCampaignSetup(manifest: CampaignManifest): void {
    if (!this.exchangesConfigService.isExchangeSupported(manifest.exchange)) {
      throw new ExchangeNotSupportedError(manifest.exchange);
    }

    const exchangeConfig =
      this.exchangesConfigService.configByExchange[manifest.exchange];

    if (!exchangeConfig.enabled) {
      throw new Error('Exchange integration is disabled');
    }

    /**
     * TODO: have different campaign configuration per exchange via campaign config service
     */
    if (
      [ExchangeName.PANCAKESWAP, ExchangeName.HYPERLIQUID].includes(
        manifest.exchange as ExchangeName,
      ) &&
      ![
        CampaignType.MARKET_MAKING,
        CampaignType.COMPETITIVE_MARKET_MAKING,
      ].includes(manifest.type as CampaignType)
    ) {
      throw new Error(
        `Only market making campaigns supported for ${manifest.exchange}`,
      );
    }
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
          escrow.manifest,
          escrow.manifestHash,
        );
      } catch (error) {
        this.logger.error('Failed to download campaign manifest', error);
        throw new InvalidCampaign(
          chainId,
          campaignAddress,
          toError(error).message,
        );
      }
    } else {
      manifestString = escrow.manifest;
    }

    let manifest: CampaignManifestBase;
    try {
      manifest = manifestUtils.validateBaseSchema(manifestString);

      switch (manifest.type) {
        case CampaignType.MARKET_MAKING:
          manifestUtils.assertValidMarketMakingCampaignManifest(manifest);
          break;
        case CampaignType.COMPETITIVE_MARKET_MAKING:
          manifestUtils.assertValidCompetitiveMarketMakingCampaignManifest(
            manifest,
          );
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

      this.assertCorrectCampaignSetup(manifest);
    } catch (error) {
      throw new InvalidCampaign(
        chainId,
        campaignAddress,
        toError(error).message,
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
          /**
           * Add it for debug purpose in order to see if some campaign
           * failed to update it because of e.g. timed out `storeResults` tx
           */
          resultsCutoffAt: campaign.resultsCutoffAt?.toISOString(),
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

            startDate = new Date(lastResultAt);
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
              .add(CAMPAIGNS_DAILY_CYCLE, 'day')
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
               * - campaign cancellation requested before it reached start_date from manifest
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
            {
              excludeIneligible:
                isThresholdCampaign(campaign) &&
                isFiniteNumber(campaign.details.maxParticipants),
              logWarnings: true,
              caller: this.recordCampaignProgress.name,
            },
          );

          const rewardPool = rewardsUtils.calculateRewardPool(
            campaign,
            progress,
          );

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

          if (
            isMarketMakingCampaign(campaign) ||
            isCompetitiveMarketMakingCampaign(campaign)
          ) {
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

  /**
   * Period boundaries are [startDate, endDate)
   */
  async checkCampaignProgressForPeriod(
    campaign: CampaignEntity,
    startDate: Date,
    endDate: Date,
    options: {
      excludeIneligible?: boolean;
      logWarnings?: boolean;
      caller?: string;
    } = {},
  ): Promise<CampaignProgress<CampaignProgressMeta>> {
    if (dayjs(startDate).isAfter(endDate)) {
      throw new Error('Invalid period range provided');
    }

    const callerMeta: {
      caller: string;
      debugCaller?: string;
    } = options.caller
      ? { caller: options.caller }
      : { caller: 'unknown', debugCaller: debugUtils.getCaller() };

    const logger = this.logger.child({
      action: 'checkCampaignProgressForPeriod',
      ...callerMeta,
      campaignId: campaign.id,
      chainId: campaign.chainId,
      campaignAddress: campaign.address,
      exchangeName: campaign.exchangeName,
      campaignType: campaign.type,
      startDate,
      endDate,
      periodDuration: dayjs(endDate).diff(startDate, 'seconds'),
    });
    const checkStart = performance.now();

    const campaignProgressChecker = this.getCampaignProgressChecker(
      campaign.type,
      {
        exchangeName: campaign.exchangeName as ExchangeName,
        symbol: campaign.symbol,
        periodStart: startDate,
        periodEnd: endDate,
        ...campaign.details,
      },
    );

    const participants =
      await this.participationsRepository.findCampaignParticipants(campaign.id);

    const outcomes: ParticipantOutcome[] = [];
    for (const participant of participants) {
      try {
        const { abuseDetected, ...participantOutcomes } =
          await campaignProgressChecker.checkForParticipant(participant);

        if (participantOutcomes.score === 0 && options.excludeIneligible) {
          const exclusionLogData = {
            participantId: participant.id,
            participantOutcome: {
              abuseDetected,
              ...participantOutcomes,
            },
          };
          try {
            await this.participationsRepository.removeParticipation(
              participant.id,
              participant.campaignId,
            );
            this.logger.warn(
              'Excluded ineligible participant from campaign',
              exclusionLogData,
            );
          } catch (error) {
            this.logger.error('Failed to exclude ineligible participant', {
              ...exclusionLogData,
              error,
            });
          }
        }

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
              participantEvmAddress: participant.evmAddress,
              error,
            });
          }
          void this.exchangesService.safeRevalidateApiKey(
            participant.id,
            campaign.exchangeName,
          );
          continue;
        }

        throw error;
      }
    }

    logger.info('Campaign progress checked', {
      nParticipants: participants.length,
      checkDurationMs: performance.now() - checkStart,
    });

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
      case CampaignType.COMPETITIVE_MARKET_MAKING:
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

    const feeParams = await this.web3Service.calculateTxFees(chainId);

    const latestNonce = await signer.getNonce('latest');

    try {
      await escrowClient.storeResults(
        campaignAddress,
        resultsUrl,
        resultsHash,
        fundsToReserve,
        {
          ...feeParams,
          nonce: latestNonce,
          timeoutMs: this.campaignsConfigService.storeResultsTimeout,
        },
      );
    } catch (error) {
      this.logger.error('Failed storeResults call', {
        error,
        chainId,
        campaignAddress,
        nonce: latestNonce,
        feeParams,
      });
      throw error;
    }

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

  @ScheduleInterval(CampaignServiceJob.SYNC_CAMPAIGN_STATUSES, ms('3 minutes'))
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
      await this.participationsService.checkUserJoinedCampaign(
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

    const isParticipantLimitReached =
      await this.participationsService.checkParticipantLimitReached(campaign);
    if (isParticipantLimitReached) {
      return {
        status: CampaignJoinStatus.JOIN_IS_CLOSED,
        reason: 'max_participants_reached',
      };
    }

    const isCampaignTargetMet = await this.checkCampaignTargetMet(campaign);
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

  /**
   * TODO: deprecate this functionality once we use leaderboards data on UI
   */
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
      await this.participationsService.checkUserJoinedCampaign(
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

    const progress = await this.campaignsCache.getInterimProgress(campaign.id);
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

  @ScheduleInterval(CampaignServiceJob.DISCOVER_NEW_CAMPAIGNS, ms('10 minutes'))
  async discoverNewCampaigns(): Promise<void> {
    this.logger.debug('Campaigns discovery job started');

    for (const chainId of this.web3Service.supportedChainIds) {
      try {
        const discoveryAnchor =
          await this.campaignsCache.getChainDiscoveryAnchor(chainId);

        const discoveredEscrows = await EscrowUtils.getEscrows({
          chainId: chainId as number,
          recordingOracle: this.web3ConfigService.operatorAddress,
          status: [EscrowStatus.Pending, EscrowStatus.ToCancel],
          from: discoveryAnchor ?? undefined,
          orderDirection: OrderDirection.ASC,
          first: 50,
        });

        if (discoveredEscrows.length === 0) {
          this.logger.debug('No new escrows discovered for chain', {
            chainId,
            discoveryAnchor,
          });
          continue;
        }

        for (const discoveredEscrow of discoveredEscrows) {
          const campaignAddress = ethers.getAddress(discoveredEscrow.address);
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

        await this.campaignsCache.setChainDiscoveryAnchor(
          chainId,
          /**
           * Some campaigns might be сreated within the same block
           * but not yet synced to subgraph, so use last discovered
           * campaign date as anchor to avoid missing them
           */
          new Date(discoveredEscrows.at(-1)!.createdAt),
        );
      } catch (error) {
        this.logger.error('Error while discovering new campaigns for chain', {
          chainId,
          error,
        });
      }
    }

    this.logger.debug('Campaigns discovery job finished');
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
                {
                  caller: this.refreshInterimProgressCache.name,
                },
              );
              await this.campaignsCache.setInterimProgress(
                campaign.id,
                progress,
                campaign.endDate,
              );
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

  /**
   * Should be used only to get active timeframe for interim progress
   */
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
      dayjs(now).diff(campaign.startDate, 'day', false) / CAMPAIGNS_DAILY_CYCLE,
    );

    const timeframeStart = dayjs(campaign.startDate)
      .add(timeframesPassed * CAMPAIGNS_DAILY_CYCLE, 'day')
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

    if (campaign.exchangeName === ExchangeName.PANCAKESWAP) {
      const client = this.exchangeApiClientFactory.createDex(
        ExchangeName.PANCAKESWAP,
        {
          userId: 'system',
          userEvmAddress: 'n/a',
        },
      ) as PancakeswapClient;

      const subgraphMeta = await client.fetchSubgraphMeta();

      const lastBlockSyncedAt = new Date(subgraphMeta.block.timestamp * 1000);
      if (lastBlockSyncedAt.valueOf() < timeframeEnd.valueOf()) {
        timeframeEnd = lastBlockSyncedAt;
      }
    }

    return {
      start: timeframeStart,
      end: timeframeEnd,
    };
  }

  async checkCampaignTargetMet(campaign: CampaignEntity): Promise<boolean> {
    if (!isHoldingCampaign(campaign)) {
      return false;
    }

    if (!this.campaignsConfigService.isHoldingJoinLimitEnabled) {
      return false;
    }

    const campaignProgress =
      await this.campaignsCache.getInterimProgress<HoldingMeta>(campaign.id);
    if (!campaignProgress) {
      return false;
    }

    const isDailyBalanceTargetMet =
      campaignProgress.meta.total_balance >=
      campaign.details.dailyBalanceTarget;

    return isDailyBalanceTargetMet;
  }

  async getCampaignLeaderboard(
    chainId: number,
    campaignAddress: string,
  ): Promise<{
    entries: LeaderboardEntry[];
    total: number;
    actualOn: Date;
  }> {
    const campaign = await this.findOneByChainIdAndAddress(
      chainId,
      campaignAddress,
    );
    if (!campaign) {
      /**
       * It might be that campaign escrow is not synced yet,
       * so return empty results in this case
       */
      return {
        entries: [],
        total: 0,
        actualOn: new Date(),
      };
    }

    if (
      [CampaignStatus.CANCELLED, CampaignStatus.COMPLETED].includes(
        campaign.status,
      )
    ) {
      throw new CampaignAlreadyFinishedError(
        campaign.chainId,
        campaign.address,
      );
    }

    let resultsToInspect: ParticipantOutcome[] = [];
    let estimatedRewardPool: string;
    let actualOn: Date;
    if (
      [
        CampaignStatus.PENDING_CANCELLATION,
        CampaignStatus.PENDING_COMPLETION,
      ].includes(campaign.status)
    ) {
      if (!this.prefinalResultsCache.has(campaign.id)) {
        const intermediateResultsData =
          await this.retrieveCampaignIntermediateResults(campaign);
        this.prefinalResultsCache.set(campaign.id, intermediateResultsData!);
      }

      const latestIntermediateResult = this.prefinalResultsCache
        .get(campaign.id)!
        .results.at(-1)!;
      for (const outcomesBatch of latestIntermediateResult.participants_outcomes_batches) {
        resultsToInspect.push(...outcomesBatch.results);
      }
      estimatedRewardPool = latestIntermediateResult.reserved_funds;
      /**
       * Results are final, so always actual
       */
      actualOn = new Date();
    } else {
      const cachedInterimResults = await this.campaignsCache.getInterimProgress(
        campaign.id,
      );

      if (cachedInterimResults) {
        resultsToInspect = cachedInterimResults.participants_outcomes;
        estimatedRewardPool = rewardsUtils.calculateRewardPool(
          campaign,
          cachedInterimResults,
        );
        actualOn = new Date(cachedInterimResults.to);
      } else {
        resultsToInspect = [];
        estimatedRewardPool = '0';
        actualOn = new Date();
      }
    }

    const estimatedRewards = isCompetitiveMarketMakingCampaign(campaign)
      ? rewardsUtils.estimateCompetitiveRewards(
          resultsToInspect,
          estimatedRewardPool,
          campaign,
        )
      : rewardsUtils.estimateRewards(resultsToInspect, estimatedRewardPool);

    const leaderboardEntries: LeaderboardEntry[] = [];
    let total = 0;
    for (const participantOutcome of resultsToInspect) {
      let result: number;
      if (
        isMarketMakingCampaign(campaign) ||
        isCompetitiveMarketMakingCampaign(campaign)
      ) {
        result = participantOutcome.total_volume as number;
      } else if (isHoldingCampaign(campaign) || isThresholdCampaign(campaign)) {
        result = participantOutcome.total_balance as number;
      } else {
        throw new Error(
          `Unknown campaign type for leaderboard calculation: ${campaign.type}`,
        );
      }

      total += result;
      leaderboardEntries.push({
        address: participantOutcome.address,
        score: participantOutcome.score,
        result,
        estimatedReward: estimatedRewards[participantOutcome.address],
      });
    }

    return {
      entries: _.orderBy(leaderboardEntries, 'score', 'desc'),
      total,
      actualOn,
    };
  }
}
