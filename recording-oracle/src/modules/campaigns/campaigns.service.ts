import crypto from 'crypto';

import {
  ESCROW_BULK_PAYOUT_MAX_ITEMS,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import _ from 'lodash';

import { ContentType } from '@/common/enums';
import Environment from '@/common/utils/environment';
import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import * as web3Utils from '@/common/utils/web3';
import { isValidExchangeName } from '@/common/validators';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { ExchangeApiClientFactory } from '@/modules/exchange';
import { ExchangeApiKeysService } from '@/modules/exchange-api-keys';
import { StorageService } from '@/modules/storage';
import type { UserEntity } from '@/modules/users';
import { Web3Service } from '@/modules/web3';

import { CampaignEntity } from './campaign.entity';
import {
  CampaignAlreadyFinishedError,
  CampaignNotFoundError,
  InvalidCampaign,
} from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import { SUPPORTED_CAMPAIGN_TYPES } from './constants';
import * as manifestUtils from './manifest.utils';
import {
  type CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  MarketMakingResultsChecker,
} from './progress-checking';
import {
  CampaignEscrowInfo,
  CampaignManifest,
  CampaignStatus,
  CampaignType,
  IntermediateResult,
  IntermediateResultsData,
  ParticipantOutcome,
  ParticipantsOutcomesBatch,
} from './types';
import { UserCampaignEntity } from './user-campaign.entity';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatsRepository } from './volume-stats.repository';

const PROGRESS_RECORDING_SCHEDULE = Environment.isDevelopment()
  ? CronExpression.EVERY_MINUTE
  : CronExpression.EVERY_30_MINUTES;

const COMPLETION_TRACKING_SCHEDULE = Environment.isDevelopment()
  ? CronExpression.EVERY_MINUTE
  : CronExpression.EVERY_HOUR;

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
      throw new CampaignAlreadyFinishedError(campaign.address);
    }

    const exchangeApiKeyId =
      await this.exchangeApiKeysService.assertUserHasAuthorizedKeys(
        userId,
        campaign.exchangeName,
      );

    const newUserCampaign = new UserCampaignEntity();
    newUserCampaign.userId = userId;
    newUserCampaign.campaignId = campaign.id;
    newUserCampaign.exchangeApiKeyId = exchangeApiKeyId;
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
    const newCampaign = new CampaignEntity();
    newCampaign.id = crypto.randomUUID();
    newCampaign.chainId = chainId;
    newCampaign.address = ethers.getAddress(address);
    newCampaign.type = manifest.type;
    newCampaign.exchangeName = manifest.exchange;
    newCampaign.dailyVolumeTarget = manifest.daily_volume_target.toString();
    newCampaign.pair = manifest.pair;
    newCampaign.lastResultsAt = null;
    newCampaign.startDate = manifest.start_date;
    newCampaign.endDate = manifest.end_date;
    newCampaign.status = CampaignStatus.ACTIVE;
    newCampaign.fundAmount = escrowInfo.fundAmount.toString();
    newCampaign.fundToken = escrowInfo.fundTokenSymbol;

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
      throw new CampaignNotFoundError(campaignAddress);
    }

    // Safety-belt for missing subgraph data START
    if (!escrow.token) {
      throw new InvalidCampaign(campaignAddress, 'Missing fund token data');
    }
    if (!escrow.totalFundedAmount) {
      throw new InvalidCampaign(campaignAddress, 'Missing fund amount data');
    }
    if (!escrow.manifest) {
      throw new InvalidCampaign(campaignAddress, 'Missing manifest data');
    }
    // Safety-belt for missing subgraph data END

    const isEscrowForThisOracle =
      escrow.recordingOracle?.toLowerCase() ===
      this.web3ConfigService.operatorAddress.toLowerCase();

    if (!isEscrowForThisOracle) {
      throw new InvalidCampaign(
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
        throw new InvalidCampaign(campaignAddress, error.message as string);
      }
    } else {
      manifestString = escrow.manifest as string;
    }

    const manifest = manifestUtils.validateSchema(manifestString);

    /*
     * Not including this into Joi schema to send meaningful errors
     */
    if (!isValidExchangeName(manifest.exchange)) {
      throw new InvalidCampaign(
        campaignAddress,
        `Exchange not supported: ${manifest.exchange}`,
      );
    }

    if (!SUPPORTED_CAMPAIGN_TYPES.includes(manifest.type as CampaignType)) {
      throw new InvalidCampaign(
        campaignAddress,
        `Campaign type not supported: ${manifest.type}`,
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
      },
    };
  }

  @Cron(PROGRESS_RECORDING_SCHEDULE)
  async recordCampaignsProgress(): Promise<void> {
    this.logger.info('Campaigns progress recording job started');

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

    this.logger.info('Campaigns progress recording job finished');
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
          action: 'record-campaign-progress',
          campaignId: campaign.id,
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

            const lastResultDate = new Date(lastResultAt);
            if (dayjs().diff(lastResultAt, 'day') === 0) {
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
              pair: campaign.pair,
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

          const campaignParticipants =
            await this.userCampaignsRepository.findCampaignUsers(campaign.id);

          const progress = await this.checkCampaignProgressForPeriod(
            campaign,
            campaignParticipants,
            startDate,
            endDate,
          );

          logger.debug('Campaign progress checked', {
            from: progress.from,
            to: progress.to,
            total_volume: progress.total_volume,
            participants_outcomes_batches:
              progress.participants_outcomes_batches.map((b) => ({
                id: b.id,
                n_results: b.results.length,
              })),
          });
          await this.recordGeneratedVolume(campaign, progress);

          intermediateResults.results.push(progress);
          const storedResultsMeta =
            await this.recordCampaignIntermediateResults(intermediateResults);

          logger.debug('Campaign progress recorded', storedResultsMeta);

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
    participants: UserEntity[],
    startDate: Date,
    endDate: Date,
  ): Promise<IntermediateResult> {
    const campaignProgressChecker = this.getCampaignProgressChecker(
      campaign.type,
      {
        exchangeName: campaign.exchangeName,
        tradingPair: campaign.pair,
        tradingPeriodStart: startDate,
        tradingPeriodEnd: endDate,
      },
    );

    let totalVolume = 0;
    const outcomes: ParticipantOutcome[] = [];
    for (const participant of participants) {
      const exchangeApiKey = await this.exchangeApiKeysService.retrieve(
        participant.id,
        campaign.exchangeName,
      );

      const participantOutcomes =
        await campaignProgressChecker.checkForParticipant({
          apiKey: exchangeApiKey.apiKey,
          secret: exchangeApiKey.secretKey,
        });

      if (participantOutcomes.abuseDetected) {
        this.logger.warn('Abuse detected. Skipping participant outcome', {
          campaignId: campaign.id,
          participantId: participant.id,
          startDate,
          endDate,
        });
        continue;
      }

      totalVolume += participantOutcomes.totalVolume;

      outcomes.push({
        address: participant.evmAddress,
        score: participantOutcomes.score,
        total_volume: participantOutcomes.totalVolume,
      });
    }

    const outcomesBatches: ParticipantsOutcomesBatch[] = [];
    for (const chunk of _.chunk(outcomes, ESCROW_BULK_PAYOUT_MAX_ITEMS)) {
      outcomesBatches.push({
        id: crypto.randomUUID(),
        results: chunk,
      });
    }

    return {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      total_volume: totalVolume,
      participants_outcomes_batches: outcomesBatches,
    };
  }

  private getCampaignProgressChecker(
    campaignType: string,
    campaignCheckerSetup: CampaignProgressCheckerSetup,
  ): CampaignProgressChecker {
    const exchangeApiClientFactory = this.moduleRef.get(
      ExchangeApiClientFactory,
      { strict: false },
    );

    switch (campaignType) {
      default:
        return new MarketMakingResultsChecker(
          exchangeApiClientFactory,
          campaignCheckerSetup,
        );
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
      const [_baseTokenSymbol, quoteTokenSymbol] = campaign.pair.split('/');

      const quoteTokenPriceUsd =
        await this.web3Service.getTokenPriceUsd(quoteTokenSymbol);

      if (!quoteTokenPriceUsd) {
        return;
      }

      const volumeUsd = intermediateResult.total_volume * quoteTokenPriceUsd;

      await this.volumeStatsRepository.upsert(
        {
          exchangeName: campaign.exchangeName,
          campaignAddress: campaign.address,
          periodStart: new Date(intermediateResult.from),
          periodEnd: new Date(intermediateResult.to),
          volume: intermediateResult.total_volume.toString(),
          volumeUsd: volumeUsd.toString(),
        },
        ['exchangeName', 'campaignAddress', 'periodStart'],
      );
    } catch {
      // noop
    }
  }

  @Cron(COMPLETION_TRACKING_SCHEDULE)
  async trackCampaignsCompletion(): Promise<void> {
    this.logger.info('Campaigns completion tracking job started');

    const campaignsToTrack =
      await this.campaignsRepository.findForCompletionTracking();

    for (const campaign of campaignsToTrack) {
      const escrow = await EscrowUtils.getEscrow(
        campaign.chainId,
        campaign.address,
      );

      const completeStatusString = EscrowStatus[EscrowStatus.Complete];
      if (escrow.status === completeStatusString) {
        this.logger.info('Completing campaign', {
          campaignId: campaign.id,
        });
        campaign.status = CampaignStatus.COMPLETED;
        await this.campaignsRepository.save(campaign);
      }
    }

    this.logger.info('Campaigns completion tracking job finished');
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
}
