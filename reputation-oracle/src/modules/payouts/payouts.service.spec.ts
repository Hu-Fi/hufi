/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('@human-protocol/sdk');
jest.mock('@/logger');

import crypto from 'crypto';

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient, EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import _ from 'lodash';

import { ContentType } from '@/common/enums';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '@/modules/web3/fixtures';

import {
  generateCampaign,
  generateEscrow,
  generateIntermediateResult,
  generateIntermediateResultsData,
  generateManifest,
  generateParticipantOutcome,
} from './fixtures';
import precisionSensitiveResult from './fixtures/precision_sensitive_result.json';
import { PayoutsService } from './payouts.service';
import * as payoutsUtils from './payouts.utils';
import { CampaignWithResults, IntermediateResult } from './types';

const mockStorageService = createMock<StorageService>();
const mockWeb3Service = createMock<Web3Service>();

const mockedEscrowClient = jest.mocked(EscrowClient);
const mockedEscrowUtils = jest.mocked(EscrowUtils);

describe('PayoutsService', () => {
  let payoutsService: PayoutsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PayoutsService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
      ],
    }).compile();

    payoutsService = moduleRef.get<PayoutsService>(PayoutsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(payoutsService).toBeDefined();
  });

  describe('getCampaignsForPayouts', () => {
    const TEST_TOKEN_DECIMALS = faker.helpers.arrayElement([6, 18]);

    let chainId: number;

    beforeEach(() => {
      chainId = generateTestnetChainId();
      mockWeb3Service.getTokenDecimals.mockResolvedValue(TEST_TOKEN_DECIMALS);
    });

    it('should query escrows with correct params', async () => {
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([]);

      await payoutsService['getCampaignsForPayouts'](chainId);

      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledTimes(1);
      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledWith({
        chainId,
        reputationOracle: mockWeb3ConfigService.operatorAddress,
        status: [EscrowStatus.Pending, EscrowStatus.Partial],
        first: 100,
      });
    });

    it('shold return campaign data from escrow', async () => {
      const expectedEscrow = generateEscrow();
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([expectedEscrow]);

      const campaigns = await payoutsService['getCampaignsForPayouts'](chainId);

      expect(campaigns.length).toBe(1);
      expect(campaigns[0]).toEqual({
        chainId: expectedEscrow.chainId,
        address: expectedEscrow.address,
        manifest: expectedEscrow.manifest,
        manifestHash: expectedEscrow.manifestHash,
        intermediateResultsUrl: expectedEscrow.intermediateResultsUrl,
        fundTokenAddress: expectedEscrow.token,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
        fundAmount: Number(
          ethers.formatUnits(
            expectedEscrow.totalFundedAmount,
            TEST_TOKEN_DECIMALS,
          ),
        ),
        launcher: expectedEscrow.launcher,
      });
    });

    it('should skip escrows w/o intermediate results', async () => {
      const expectedEscrow = generateEscrow();

      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([
        expectedEscrow,
        Object.assign(generateEscrow(), { intermediateResultsUrl: '' }),
      ]);

      const campaigns = await payoutsService['getCampaignsForPayouts'](chainId);

      expect(campaigns.length).toBe(1);
      expect(campaigns[0].address).toEqual(expectedEscrow.address);
    });
  });

  describe('uploadFinalResults', () => {
    it('should upload results with proper meta', async () => {
      const expectedFileUrl = faker.internet.url();
      mockStorageService.uploadData.mockResolvedValueOnce(expectedFileUrl);

      const intermediateResultsData = generateIntermediateResultsData();
      const stringifiedResults = JSON.stringify(intermediateResultsData);
      const resultsHash = crypto
        .createHash('sha256')
        .update(stringifiedResults)
        .digest('hex');

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );

      const meta = await payoutsService['uploadFinalResults'](
        {
          address: campaignAddress,
        } as CampaignWithResults,
        intermediateResultsData,
      );

      expect(mockStorageService.uploadData).toHaveBeenCalledTimes(1);
      expect(mockStorageService.uploadData).toHaveBeenCalledWith(
        stringifiedResults,
        `${campaignAddress}/${resultsHash}.json`,
        ContentType.JSON,
      );

      expect(meta).toEqual({
        url: expectedFileUrl,
        hash: resultsHash,
      });
    });
  });

  describe('runPayoutsCycle', () => {
    const originalSupportedChainIds = mockWeb3Service.supportedChainIds;
    const supportedChainId = faker.number.int();

    let spyOnGetCampaignsForPayouts: jest.SpyInstance;
    let spyOnRunPayoutsCycleForCampaign: jest.SpyInstance;

    beforeAll(() => {
      spyOnGetCampaignsForPayouts = jest.spyOn(
        payoutsService as any,
        'getCampaignsForPayouts',
      );
      spyOnGetCampaignsForPayouts.mockImplementation();

      spyOnRunPayoutsCycleForCampaign = jest.spyOn(
        payoutsService as any,
        'runPayoutsCycleForCampaign',
      );
      spyOnRunPayoutsCycleForCampaign.mockImplementation();
    });

    afterAll(() => {
      (mockWeb3Service.supportedChainIds as any) = originalSupportedChainIds;

      spyOnGetCampaignsForPayouts.mockRestore();
      spyOnRunPayoutsCycleForCampaign.mockRestore();
    });

    beforeEach(() => {
      (mockWeb3Service.supportedChainIds as any) = [supportedChainId];
    });

    it('should process each supported chain', async () => {
      (mockWeb3Service.supportedChainIds as any) = [
        faker.number.int(),
        faker.number.int(),
      ];
      spyOnGetCampaignsForPayouts.mockResolvedValue([]);

      await payoutsService.runPayoutsCycle();

      expect(spyOnGetCampaignsForPayouts).toHaveBeenCalledTimes(2);
      for (const chainId of mockWeb3Service.supportedChainIds) {
        expect(spyOnGetCampaignsForPayouts).toHaveBeenCalledWith(chainId);
      }

      expect(spyOnRunPayoutsCycleForCampaign).toHaveBeenCalledTimes(0);
    });

    it('should process each campaign for chain', async () => {
      const campaigns = [generateCampaign(), generateCampaign()];
      spyOnGetCampaignsForPayouts.mockResolvedValueOnce(campaigns);

      await payoutsService.runPayoutsCycle();

      expect(spyOnGetCampaignsForPayouts).toHaveBeenCalledTimes(1);

      expect(spyOnRunPayoutsCycleForCampaign).toHaveBeenCalledTimes(
        campaigns.length,
      );
      for (const campaign of campaigns) {
        expect(spyOnRunPayoutsCycleForCampaign).toHaveBeenCalledWith(campaign);
      }
    });
  });

  describe('calculateRewardsForIntermediateResult', () => {
    const TEST_TOKEN_DECIMALS = faker.number.int({ min: 5, max: 18 });

    it('should return rewards in batches', () => {
      const rewardsBatches = payoutsService[
        'calculateRewardsForIntermediateResult'
      ](generateIntermediateResult(), TEST_TOKEN_DECIMALS);

      expect(rewardsBatches.length).toBe(0);
    });

    it('should calculate rewards for all participants in batches', () => {
      const intermediateResult = generateIntermediateResult();

      const nBatches = faker.number.int({ min: 2, max: 4 });
      let totalParticipants = 0;
      const participantAddressesSet = new Set<string>();
      for (let i = 0; i < nBatches; i += 1) {
        const batch = {
          id: faker.string.uuid(),
          results: Array.from(
            { length: faker.number.int({ min: 1, max: 3 }) },
            () => {
              const outcome = generateParticipantOutcome({ score: 1 });

              participantAddressesSet.add(outcome.address);

              return outcome;
            },
          ),
        };

        intermediateResult.participants_outcomes_batches.push(batch);

        totalParticipants += batch.results.length;
      }

      const equalReward = faker.number.int({ min: 15, max: 42 });
      intermediateResult.reserved_funds = totalParticipants * equalReward;

      const rewardsBatches = payoutsService[
        'calculateRewardsForIntermediateResult'
      ](intermediateResult, TEST_TOKEN_DECIMALS);

      const rewardsMap = new Map<string, number>();
      for (
        let i = 0;
        i < intermediateResult.participants_outcomes_batches.length;
        i += 1
      ) {
        const { id: rewardsBatchId, rewards: rewardsBatch } = rewardsBatches[i];

        expect(rewardsBatchId).toBe(
          intermediateResult.participants_outcomes_batches[i].id,
        );

        for (const reward of rewardsBatch) {
          rewardsMap.set(reward.address, reward.amount);
        }
      }

      for (const participant of participantAddressesSet) {
        expect(rewardsMap.get(participant)).toBe(equalReward);
      }
    });

    it('should correctly calculate rewards for precision-sensitive results', () => {
      const rewards = payoutsService['calculateRewardsForIntermediateResult'](
        Object.assign({}, precisionSensitiveResult, {
          from: new Date(precisionSensitiveResult.from),
          to: new Date(precisionSensitiveResult.to),
        }),
        18,
      );

      let total = new Decimal(0);
      for (const reward of rewards[0].rewards) {
        total = total.plus(reward.amount);
      }
      expect(total.toNumber()).toBe(41.99999999999999);
      /**
       * Input and shanpshot for this test are based on real-data
       * and correct at the time of adding. They shouldn't be changed
       * unless some bug in input/output itself is found.
       */
      expect(rewards).toMatchSnapshot();
    });
  });

  describe('runPayoutsCycleForCampaign', () => {
    const mockedCampaign = generateCampaign();
    const mockedGasPrice = faker.number.bigInt();
    const mockedParticipantAddress = faker.finance.ethereumAddress();
    const mockedParticipantsOutcomesBatch = {
      id: faker.string.uuid(),
      results: [
        {
          address: mockedParticipantAddress,
          score: faker.number.float({ min: 0.1 }),
        },
      ],
    };
    const mockedReservedFunds = faker.number.int({ min: 1, max: 10 });
    const mockedFinalResultsUrl = faker.internet.url();
    const mockedFinalResultsHash = faker.string.hexadecimal();
    const mockedManifest = generateManifest();

    let spyOnRetrieveCampaignManifest: jest.SpyInstance;
    let spyOnDownloadIntermediateResults: jest.SpyInstance;
    let spyOnUploadFinalResults: jest.SpyInstance;
    let spyOnGetBulkPayoutsCount: jest.SpyInstance;
    let spyOnWriteRewardsBatchToFile: jest.SpyInstance;

    const mockedGetEscrowBalance = jest.fn();
    const mockedGetEscrowReservedFunds = jest.fn();
    const mockedGetEscrowStatus = jest.fn();
    const mockedBulkPayOut = jest.fn();
    const mockedCompleteEscrow = jest.fn();

    let mockedIntermediateResult: IntermediateResult;
    let mockedEscrowReservedFunds: bigint;

    beforeAll(() => {
      spyOnRetrieveCampaignManifest = jest.spyOn(
        payoutsUtils,
        'retrieveCampaignManifest',
      );
      spyOnRetrieveCampaignManifest.mockImplementation();

      spyOnDownloadIntermediateResults = jest.spyOn(
        payoutsUtils,
        'downloadIntermediateResults',
      );
      spyOnDownloadIntermediateResults.mockImplementation();

      spyOnUploadFinalResults = jest.spyOn(
        payoutsService as any,
        'uploadFinalResults',
      );
      spyOnUploadFinalResults.mockImplementation();

      spyOnGetBulkPayoutsCount = jest.spyOn(
        payoutsService as any,
        'getBulkPayoutsCount',
      );
      spyOnGetBulkPayoutsCount.mockImplementation();

      spyOnWriteRewardsBatchToFile = jest.spyOn(
        payoutsService as any,
        'writeRewardsBatchToFile',
      );
      spyOnWriteRewardsBatchToFile.mockImplementation();
    });

    afterAll(() => {
      spyOnRetrieveCampaignManifest.mockRestore();
      spyOnDownloadIntermediateResults.mockRestore();
      spyOnUploadFinalResults.mockRestore();
      spyOnGetBulkPayoutsCount.mockRestore();
      spyOnWriteRewardsBatchToFile.mockRestore();
    });

    beforeEach(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getBalance: mockedGetEscrowBalance,
        getStatus: mockedGetEscrowStatus,
        getReservedFunds: mockedGetEscrowReservedFunds,
        bulkPayOut: mockedBulkPayOut,
        complete: mockedCompleteEscrow,
      } as unknown as EscrowClient);

      mockWeb3Service.calculateGasPrice.mockResolvedValue(mockedGasPrice);

      spyOnRetrieveCampaignManifest.mockResolvedValueOnce(mockedManifest);

      mockedIntermediateResult = generateIntermediateResult();
      mockedIntermediateResult.reserved_funds = mockedReservedFunds;
      mockedIntermediateResult.participants_outcomes_batches.push(
        _.cloneDeep(mockedParticipantsOutcomesBatch),
      );
      const intermediateResultsData = generateIntermediateResultsData();
      intermediateResultsData.results.push(mockedIntermediateResult);
      spyOnDownloadIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      mockedEscrowReservedFunds = ethers.parseUnits(
        mockedReservedFunds.toString(),
        mockedCampaign.fundTokenDecimals,
      );
      mockedGetEscrowReservedFunds.mockResolvedValue(mockedEscrowReservedFunds);

      spyOnGetBulkPayoutsCount.mockResolvedValueOnce(0);

      spyOnUploadFinalResults.mockResolvedValueOnce({
        url: mockedFinalResultsUrl,
        hash: mockedFinalResultsHash,
      });
    });

    it('should gracefully handle incomplete intermediate results', async () => {
      spyOnDownloadIntermediateResults
        .mockReset()
        .mockResolvedValueOnce(generateIntermediateResultsData());

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Payouts failed for campaign',
        new Error('Intermediate results are not recorded'),
      );

      expect(spyOnGetBulkPayoutsCount).toHaveBeenCalledTimes(0);
      expect(spyOnUploadFinalResults).toHaveBeenCalledTimes(0);
      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    it('should gracefully handle invalid reserved funds', async () => {
      mockedGetEscrowReservedFunds.mockReset().mockResolvedValueOnce(
        faker.number.int({
          max:
            mockedIntermediateResult.reserved_funds -
            faker.number.float({ min: 0.0000001 }),
        }),
      );

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Payouts failed for campaign',
        new Error('Expected payouts amount higher than reserved funds'),
      );
      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    it('should run payouts and not attempt finish campaign if not ended', async () => {
      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
      expect(mockedBulkPayOut).toHaveBeenCalledWith(
        mockedCampaign.address,
        [mockedParticipantAddress],
        [
          ethers.parseUnits(
            mockedReservedFunds.toString(),
            mockedCampaign.fundTokenDecimals,
          ),
        ],
        mockedFinalResultsUrl,
        mockedFinalResultsHash,
        mockedParticipantsOutcomesBatch.id,
        false,
        {
          gasPrice: mockedGasPrice,
        },
      );

      expect(logger.info).toHaveBeenCalledTimes(6);
      expect(logger.info).toHaveBeenCalledWith(
        'Rewards batch successfully paid',
        {
          batchId: mockedIntermediateResult.participants_outcomes_batches[0].id,
        },
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Campaign not finished yet, skip completion',
      );

      expect(mockedGetEscrowReservedFunds).toHaveBeenCalledTimes(1);
      expect(mockedGetEscrowReservedFunds).toHaveBeenCalledWith(
        mockedCampaign.address,
      );

      expect(mockedGetEscrowStatus).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    it('should skip already paid results', async () => {
      spyOnGetBulkPayoutsCount.mockReset().mockResolvedValueOnce(1);

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(logger.debug).toHaveBeenCalledTimes(2);
      expect(logger.debug).toHaveBeenCalledWith(
        'Skipped rewards batch as per bulkPayoutsCount',
        {
          batchId: mockedIntermediateResult.participants_outcomes_batches[0].id,
          batchTotalReward: expect.stringMatching(/^\d+(\.\d+)?$/),
        },
      );

      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    describe('campaign completion', () => {
      beforeEach(() => {
        const manifest = generateManifest();
        manifest.end_date = mockedIntermediateResult.to.toISOString();
        spyOnRetrieveCampaignManifest
          .mockReset()
          .mockResolvedValueOnce(manifest);
      });

      it('should run payouts and skip completion if auto-completed', async () => {
        mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Complete);

        await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

        expect(logger.info).toHaveBeenCalledTimes(6);
        expect(logger.info).toHaveBeenCalledWith(
          'Campaign auto-completed during payouts',
        );

        expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
        expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
      });

      it('should run payouts and complete campaign if not auto-completed', async () => {
        mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Partial);

        await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

        expect(logger.info).toHaveBeenCalledTimes(6);
        expect(logger.info).toHaveBeenCalledWith(
          'Campaign is fully paid, completing it',
        );

        expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
        expect(mockedCompleteEscrow).toHaveBeenCalledTimes(1);
      });

      it('should warn if unknown status', async () => {
        const unknownStatus = -1;
        mockedGetEscrowStatus.mockResolvedValueOnce(unknownStatus);

        await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(
          'Unexpected campaign escrow status',
          {
            escrowStatus: unknownStatus,
          },
        );

        expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
        expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
      });

      it('should complete with refund if campaign has "zero" results', async () => {
        const mockedEscrowBalance = faker.number.bigInt({ min: 1 });
        mockedGetEscrowReservedFunds.mockReset().mockResolvedValueOnce(0);
        mockedIntermediateResult.reserved_funds = 0;
        mockedIntermediateResult.participants_outcomes_batches = [];

        mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);
        mockedGetEscrowBalance.mockResolvedValueOnce(mockedEscrowBalance);

        await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

        expect(logger.info).toHaveBeenCalledTimes(5);
        expect(logger.info).toHaveBeenCalledWith(
          'Campaign ended with empty results, completing it',
        );

        expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
        expect(mockedBulkPayOut).toHaveBeenLastCalledWith(
          mockedCampaign.address,
          [mockedCampaign.launcher],
          [mockedEscrowBalance],
          mockedFinalResultsUrl,
          mockedFinalResultsHash,
          'empty_results_tx',
          true,
          {
            gasPrice: mockedGasPrice,
          },
        );
      });
    });
  });
});
