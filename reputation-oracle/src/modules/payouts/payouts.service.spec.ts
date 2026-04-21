jest.mock('@human-protocol/sdk');
jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  type IEscrow,
} from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import _ from 'lodash';

import { ContentType } from '@/common/enums';
import * as cryptoUtils from '@/common/utils/crypto';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { StorageService } from '@/modules/storage';
import { WalletWithProvider, Web3Service } from '@/modules/web3';
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
import notationSensitiveResult from './fixtures/notation_sensitive_result.json';
import precisionSensitiveResult from './fixtures/precision_sensitive_result.json';
import { PayoutsService } from './payouts.service';
import * as payoutsUtils from './payouts.utils';
import {
  BaseCampaignManifest,
  CampaignWithResults,
  CompetitiveCampaignManifest,
  IntermediateResult,
  IntermediateResultsData,
} from './types';

const mockStorageService = createMock<StorageService>();
const mockWeb3Service = createMock<Web3Service>();

const mockedEscrowClient = jest.mocked(EscrowClient);
const mockedEscrowUtils = jest.mocked(EscrowUtils);

const mockedSigner = createMock<WalletWithProvider>();

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
        status: [
          EscrowStatus.Pending,
          EscrowStatus.Partial,
          EscrowStatus.ToCancel,
        ],
        first: 100,
      });
    });

    it('should return campaign data for pending escrow', async () => {
      const expectedEscrow = generateEscrow(EscrowStatus.Pending);
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([expectedEscrow]);

      const campaigns = await payoutsService['getCampaignsForPayouts'](chainId);

      expect(campaigns.length).toBe(1);
      expect(campaigns[0]).toEqual({
        chainId: expectedEscrow.chainId,
        address: expectedEscrow.address,
        status: expectedEscrow.status,
        manifest: expectedEscrow.manifest,
        manifestHash: expectedEscrow.manifestHash,
        intermediateResultsUrl: expectedEscrow.intermediateResultsUrl,
        intermediateResultsHash: expectedEscrow.intermediateResultsHash,
        fundTokenAddress: expectedEscrow.token,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
        fundAmount: Number(
          ethers.formatUnits(
            expectedEscrow.totalFundedAmount,
            TEST_TOKEN_DECIMALS,
          ),
        ),
        launcher: expectedEscrow.launcher,
        cancellationRequestedAt: null,
      });
    });

    it('should return campaign data for to_cancel escrow', async () => {
      const expectedEscrow = generateEscrow(EscrowStatus.ToCancel);
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([expectedEscrow]);

      const campaigns = await payoutsService['getCampaignsForPayouts'](chainId);

      expect(campaigns.length).toBe(1);
      expect(campaigns[0]).toEqual({
        chainId: expectedEscrow.chainId,
        address: expectedEscrow.address,
        status: expectedEscrow.status,
        manifest: expectedEscrow.manifest,
        manifestHash: expectedEscrow.manifestHash,
        intermediateResultsUrl: expectedEscrow.intermediateResultsUrl,
        intermediateResultsHash: expectedEscrow.intermediateResultsHash,
        fundTokenAddress: expectedEscrow.token,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
        fundAmount: Number(
          ethers.formatUnits(
            expectedEscrow.totalFundedAmount,
            TEST_TOKEN_DECIMALS,
          ),
        ),
        launcher: expectedEscrow.launcher,
        cancellationRequestedAt: new Date(
          expectedEscrow.cancellationRequestedAt!,
        ),
      });
    });

    it('should skip to_cancel escrow w/o cancellation request date', async () => {
      const expectedEscrow = generateEscrow(EscrowStatus.ToCancel);
      expectedEscrow.cancellationRequestedAt = null;
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([expectedEscrow]);

      const campaigns = await payoutsService['getCampaignsForPayouts'](chainId);

      expect(campaigns.length).toBe(0);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'ToCancel campaign is missing cancellation request date',
        {
          chainId,
          escrowAddress: expectedEscrow.address,
        },
      );
    });

    it('should return only "ToCancel" escrows w/o intermediate results', async () => {
      const fullEscrow = generateEscrow(EscrowStatus.Pending);
      const noResultsPendingEscrow: IEscrow = Object.assign(
        generateEscrow(EscrowStatus.Pending),
        {
          intermediateResultsUrl: null,
          intermediateResultsHash: null,
        },
      );
      const noResultsToCancelEscrow: IEscrow = Object.assign(
        generateEscrow(EscrowStatus.ToCancel),
        {
          status: EscrowStatus[EscrowStatus.ToCancel],
          intermediateResultsUrl: null,
          intermediateResultsHash: null,
        },
      );

      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([
        fullEscrow,
        noResultsPendingEscrow,
        noResultsToCancelEscrow,
      ]);

      const campaigns = await payoutsService['getCampaignsForPayouts'](chainId);

      expect(campaigns.length).toBe(2);
      expect(campaigns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            address: fullEscrow.address,
            intermediateResultsUrl: fullEscrow.intermediateResultsUrl,
            intermediateResultsHash: fullEscrow.intermediateResultsHash,
          }),
          expect.objectContaining({
            address: noResultsToCancelEscrow.address,
            intermediateResultsUrl: null,
            intermediateResultsHash: null,
          }),
        ]),
      );
    });

    it('should log subgraph error and throw meaningful one', async () => {
      const syntheticError = new Error(faker.lorem.sentence());
      mockedEscrowUtils.getEscrows.mockRejectedValueOnce(syntheticError);

      let thrownError: any;
      try {
        await payoutsService['getCampaignsForPayouts'](chainId);
      } catch (error) {
        thrownError = error;
      }

      const expectedMessage = 'Failed to get campaigns for payouts';
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(expectedMessage);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(expectedMessage, {
        chainId,
        error: syntheticError,
      });
    });
  });

  describe('uploadFinalResults', () => {
    it('should upload results with proper meta', async () => {
      const expectedFileUrl = faker.internet.url();
      mockStorageService.uploadData.mockResolvedValueOnce(expectedFileUrl);

      const intermediateResultsData = generateIntermediateResultsData();
      const stringifiedResults = JSON.stringify(intermediateResultsData);
      const resultsHash = cryptoUtils.hashString(stringifiedResults, 'sha256');

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

  describe('calculateRewardsBatches', () => {
    it('should calculate reward batches for non-competitive campaigns', () => {
      const participantAddress = faker.finance.ethereumAddress();
      const intermediateResultsData = generateIntermediateResultsData();
      intermediateResultsData.results = [
        {
          ...generateIntermediateResult(),
          reserved_funds: '10',
          participants_outcomes_batches: [
            {
              id: faker.string.uuid(),
              results: [
                generateParticipantOutcome({
                  address: participantAddress,
                  score: 1,
                }),
              ],
            },
          ],
        },
      ];

      const rewardsBatches = payoutsService['calculateRewardsBatches'](
        generateManifest(
          faker.helpers.arrayElement(['MARKET_MAKING', 'HOLDING', 'THRESHOLD']),
        ),
        intermediateResultsData,
        18,
      );

      expect(rewardsBatches).toEqual([
        {
          id: intermediateResultsData.results[0]
            .participants_outcomes_batches[0].id,
          rewards: [{ address: participantAddress, amount: '10' }],
        },
      ]);
    });

    it('should calculate rewards for competitive campaign', () => {
      const participantAddress = '0x0000000000000000000000000000000000000001';
      const minVolumeRequired = faker.number.int({ min: 50, max: 150 });
      const participantScore = faker.number.float({ min: 0.01 });
      const participantTotalVolume = faker.number.float({
        min: minVolumeRequired,
        max: minVolumeRequired + 100,
      });
      const intermediateResultsData = generateIntermediateResultsData();
      const intermediateResult = generateIntermediateResult();
      intermediateResultsData.results = [
        {
          ...intermediateResult,
          reserved_funds: 100,
          participants_outcomes_batches: [
            {
              id: faker.string.uuid(),
              results: [
                generateParticipantOutcome({
                  address: participantAddress,
                  score: participantScore,
                  total_volume: participantTotalVolume,
                }),
              ],
            },
          ],
        },
      ];

      const rewardsBatches = payoutsService['calculateRewardsBatches'](
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          end_date: faker.date.past().toISOString(),
          min_volume_required: minVolumeRequired,
          rewards_distribution: [100],
        } as CompetitiveCampaignManifest,
        intermediateResultsData,
        18,
      );

      expect(rewardsBatches).toEqual([
        {
          id: cryptoUtils.hashString(
            `${intermediateResult.from.toISOString()}/${intermediateResult.to.toISOString()}`,
            'sha256',
          ),
          rewards: [{ address: participantAddress, amount: '100' }],
        },
      ]);
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
      /**
       * In this test we have to use good numbers in order to avoid
       * flaky results because of floating point precision
       * in this particular test; we have a separate tests for precision
       */
      const intermediateResult = generateIntermediateResult();

      const nBatches = faker.number.int({ min: 2, max: 4 });
      let totalParticipants = 0;
      const participantAddressesSet = new Set<string>();
      for (let i = 0; i < nBatches; i += 1) {
        const batch = {
          id: faker.string.uuid(),
          results: Array.from({ length: 2 }, () => {
            const outcome = generateParticipantOutcome({ score: 1 });

            participantAddressesSet.add(outcome.address);

            return outcome;
          }),
        };

        intermediateResult.participants_outcomes_batches.push(batch);

        totalParticipants += batch.results.length;
      }

      const equalReward = 10;
      intermediateResult.reserved_funds = totalParticipants * equalReward;

      const rewardsBatches = payoutsService[
        'calculateRewardsForIntermediateResult'
      ](intermediateResult, TEST_TOKEN_DECIMALS);

      const rewardsMap = new Map<string, string>();
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

      const expectedReward = equalReward.toString();
      for (const participant of participantAddressesSet) {
        expect(rewardsMap.get(participant)).toBe(expectedReward);
      }
    });

    it('should correctly calculate rewards for precision-sensitive results', () => {
      const rewardsBathes = payoutsService[
        'calculateRewardsForIntermediateResult'
      ](
        Object.assign({}, precisionSensitiveResult, {
          from: new Date(precisionSensitiveResult.from),
          to: new Date(precisionSensitiveResult.to),
        }),
        18,
      );

      let total = new Decimal(0);
      for (const reward of rewardsBathes[0].rewards) {
        total = total.plus(reward.amount);
      }

      expect(total.toString()).toBe('41.999999999999999999');
      /**
       * Input and shanpshot for this test are based on real-data
       * and correct at the time of adding. They shouldn't be changed
       * unless some bug in input/output itself is found.
       */
      expect(rewardsBathes).toMatchSnapshot();
    });

    it('should correctly truncate rewards for precision-sensitive results', () => {
      const rewardAmount = '1.666666666666666666';
      const intermediateResult = generateIntermediateResult();
      intermediateResult.reserved_funds = rewardAmount;

      const participantOutcome = generateParticipantOutcome({
        /**
         * Ensure score is positive to always get rewards
         */
        score: faker.number.float({ min: 0.01 }),
      });
      intermediateResult.participants_outcomes_batches = [
        {
          id: faker.string.uuid(),
          results: [participantOutcome],
        },
      ];

      const rewardsBatches = payoutsService[
        'calculateRewardsForIntermediateResult'
      ](intermediateResult, 18);

      expect(rewardsBatches.length).toBe(1);
      expect(rewardsBatches[0].id).toBe(
        intermediateResult.participants_outcomes_batches[0].id,
      );
      expect(rewardsBatches[0].rewards.length).toBe(1);
      expect(rewardsBatches[0].rewards[0]).toEqual({
        address: participantOutcome.address,
        amount: rewardAmount,
      });
    });

    /**
     * It might be that after truncating small values are in exponential notation
     * which is not supported by ethers.js; have to catch that
     */
    it('should correctly truncate rewards for small results in correct notation', () => {
      const rewardsBathes = payoutsService[
        'calculateRewardsForIntermediateResult'
      ](
        Object.assign({}, notationSensitiveResult, {
          from: new Date(notationSensitiveResult.from),
          to: new Date(notationSensitiveResult.to),
        }),
        18,
      );

      let total = new Decimal(0);
      for (const reward of rewardsBathes[0].rewards) {
        total = total.plus(reward.amount);
      }

      /**
       * Input and shanpshot for this test are based on real-data
       * and correct at the time of adding. They shouldn't be changed
       * unless some bug in input/output itself is found.
       */
      expect(rewardsBathes).toMatchSnapshot();
    });
  });

  describe('calculateRewardsForCompetitiveIntermediateResult', () => {
    it('should return rewards batch with correct id', () => {
      const intermediateResult = generateIntermediateResult();

      const rewardsBatch = payoutsService[
        'calculateRewardsForCompetitiveIntermediateResult'
      ](
        intermediateResult,
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          pair: 'BTC/USDT',
          min_volume_required: 0.0000001,
          rewards_distribution: [20, 50, 30],
        } as CompetitiveCampaignManifest,
        18,
      );

      expect(rewardsBatch.id).toBe(
        cryptoUtils.hashString(
          `${intermediateResult.from.toISOString()}/${intermediateResult.to.toISOString()}`,
          'sha256',
        ),
      );
    });

    it('should distribute rewards by manifest percentages to top cumulative score', () => {
      const firstPlaceAddress = faker.finance.ethereumAddress();
      const secondPlaceAddress = faker.finance.ethereumAddress();
      const thirdPlaceAddress = faker.finance.ethereumAddress();

      const baseScore = faker.number.int({ min: 90, max: 180 });
      const firstPlaceScore = baseScore;
      const secondPlaceScore = Math.floor(baseScore / 2);
      const thirdPlaceScore = Math.floor(baseScore / 3);

      const intermediateResult = generateIntermediateResult();
      intermediateResult.reserved_funds = '100';
      intermediateResult.participants_outcomes_batches = [
        {
          id: faker.string.uuid(),
          results: [
            generateParticipantOutcome({
              address: secondPlaceAddress,
              score: secondPlaceScore,
              total_volume: faker.number.int({ min: 100, max: 200 }),
            }),
            generateParticipantOutcome({
              address: thirdPlaceAddress,
              score: thirdPlaceScore,
              total_volume: faker.number.int({ min: 100, max: 200 }),
            }),
            generateParticipantOutcome({
              address: firstPlaceAddress,
              score: firstPlaceScore,
              total_volume: faker.number.int({ min: 100, max: 200 }),
            }),
          ],
        },
      ];

      const rewardsBatch = payoutsService[
        'calculateRewardsForCompetitiveIntermediateResult'
      ](
        intermediateResult,
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          pair: 'BTC/USDT',
          min_volume_required: 0.0000001,
          rewards_distribution: [20, 50, 30],
        } as CompetitiveCampaignManifest,
        18,
      );

      expect(rewardsBatch.rewards).toEqual([
        { address: firstPlaceAddress, amount: '50' },
        { address: secondPlaceAddress, amount: '30' },
        { address: thirdPlaceAddress, amount: '20' },
      ]);
    });

    it('should split rewards when scores are equal', () => {
      const firstAddress = faker.finance.ethereumAddress();
      const secondAddress = faker.finance.ethereumAddress();

      const tiedScore = faker.number.int({ min: 50, max: 100 });
      const firstTotalVolume = faker.number.int({ min: 100, max: 200 });
      const secondTotalVolume = faker.number.int({ min: 201, max: 300 });

      const intermediateResult = generateIntermediateResult();
      intermediateResult.reserved_funds = '100';
      intermediateResult.participants_outcomes_batches = [
        {
          id: faker.string.uuid(),
          results: [
            generateParticipantOutcome({
              address: firstAddress,
              score: tiedScore,
              total_volume: firstTotalVolume,
            }),
            generateParticipantOutcome({
              address: secondAddress,
              score: tiedScore,
              total_volume: secondTotalVolume,
            }),
          ],
        },
      ];

      const rewardsBatch = payoutsService[
        'calculateRewardsForCompetitiveIntermediateResult'
      ](
        intermediateResult,
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          pair: 'BTC/USDT',
          min_volume_required: 0.0000001,
          rewards_distribution: [60, 40],
        } as CompetitiveCampaignManifest,
        18,
      );

      expect(rewardsBatch.rewards).toEqual([
        { address: firstAddress, amount: '50' },
        { address: secondAddress, amount: '50' },
      ]);
    });

    it('should split combined rewards for exact tie on 1st place', () => {
      const firstPlaceAddress = faker.finance.ethereumAddress();
      const secondPlaceAddress = faker.finance.ethereumAddress();
      const thirdPlaceAddress = faker.finance.ethereumAddress();
      const baseScore = faker.number.int({ min: 90, max: 180 });
      const firstPlaceScore = baseScore;
      const secondPlaceScore = baseScore;
      const thirdPlaceScore = Math.floor(baseScore / 2);
      const firstTotalVolume = faker.number.int({ min: 900, max: 1400 });
      const secondTotalVolume = faker.number.int({ min: 900, max: 1400 });
      const thirdTotalVolume = faker.number.int({ min: 700, max: 1200 });

      const intermediateResult = generateIntermediateResult();
      intermediateResult.reserved_funds = '100';
      intermediateResult.participants_outcomes_batches = [
        {
          id: faker.string.uuid(),
          results: [
            generateParticipantOutcome({
              address: firstPlaceAddress,
              score: firstPlaceScore,
              total_volume: firstTotalVolume,
            }),
            generateParticipantOutcome({
              address: secondPlaceAddress,
              score: secondPlaceScore,
              total_volume: secondTotalVolume,
            }),
            generateParticipantOutcome({
              address: thirdPlaceAddress,
              score: thirdPlaceScore,
              total_volume: thirdTotalVolume,
            }),
          ],
        },
      ];

      const rewardsBatch = payoutsService[
        'calculateRewardsForCompetitiveIntermediateResult'
      ](
        intermediateResult,
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          pair: 'BTC/USDT',
          min_volume_required: 0.0000001,
          rewards_distribution: [50, 30, 20],
        } as CompetitiveCampaignManifest,
        18,
      );

      expect(rewardsBatch.rewards).toEqual([
        { address: firstPlaceAddress, amount: '40' },
        { address: secondPlaceAddress, amount: '40' },
        { address: thirdPlaceAddress, amount: '20' },
      ]);
    });

    it('should split last rewardable place reward between tied participants', () => {
      const firstPlaceAddress = faker.finance.ethereumAddress();
      const secondPlaceAddress = faker.finance.ethereumAddress();
      const thirdPlaceAddress = faker.finance.ethereumAddress();
      const fourthPlaceAddress = faker.finance.ethereumAddress();
      const baseScore = faker.number.int({ min: 90, max: 180 });
      const firstPlaceScore = baseScore;
      const secondPlaceScore = Math.floor(baseScore / 2);
      const tiedThirdPlaceScore = Math.floor(baseScore / 3);
      const firstTotalVolume = faker.number.int({ min: 1000, max: 1400 });
      const secondTotalVolume = faker.number.int({ min: 800, max: 1200 });
      const thirdTotalVolume = faker.number.int({ min: 600, max: 900 });
      const fourthTotalVolume = faker.number.int({ min: 600, max: 900 });

      const intermediateResult = generateIntermediateResult();
      intermediateResult.reserved_funds = '100';
      intermediateResult.participants_outcomes_batches = [
        {
          id: faker.string.uuid(),
          results: [
            generateParticipantOutcome({
              address: firstPlaceAddress,
              score: firstPlaceScore,
              total_volume: firstTotalVolume,
            }),
            generateParticipantOutcome({
              address: secondPlaceAddress,
              score: secondPlaceScore,
              total_volume: secondTotalVolume,
            }),
            generateParticipantOutcome({
              address: thirdPlaceAddress,
              score: tiedThirdPlaceScore,
              total_volume: thirdTotalVolume,
            }),
            generateParticipantOutcome({
              address: fourthPlaceAddress,
              score: tiedThirdPlaceScore,
              total_volume: fourthTotalVolume,
            }),
          ],
        },
      ];

      const rewardsBatch = payoutsService[
        'calculateRewardsForCompetitiveIntermediateResult'
      ](
        intermediateResult,
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          pair: 'BTC/USDT',
          min_volume_required: 0.0000001,
          rewards_distribution: [50, 30, 20],
        } as CompetitiveCampaignManifest,
        18,
      );

      expect(rewardsBatch.rewards).toEqual([
        { address: firstPlaceAddress, amount: '50' },
        { address: secondPlaceAddress, amount: '30' },
        { address: thirdPlaceAddress, amount: '10' },
        { address: fourthPlaceAddress, amount: '10' },
      ]);
    });

    it('should split all remaining slots when many participants tie for 2nd place', () => {
      const firstPlaceAddress = faker.finance.ethereumAddress();
      const tiedSecondPlaceAddresses = Array.from({ length: 5 }, () =>
        faker.finance.ethereumAddress(),
      );
      const seventhPlaceAddress = faker.finance.ethereumAddress();
      const eighthPlaceAddress = faker.finance.ethereumAddress();

      const baseScore = faker.number.int({ min: 120, max: 240 });
      const firstPlaceScore = baseScore;
      const tiedSecondPlaceScore = Math.floor(baseScore / 2);
      const seventhPlaceScore = Math.floor(baseScore / 3);
      const eighthPlaceScore = Math.floor(baseScore / 4);
      const minVolumeRequired = faker.number.int({ min: 50, max: 120 });
      const eligibleVolume =
        minVolumeRequired + faker.number.int({ min: 1, max: 100 });

      const intermediateResult = generateIntermediateResult();
      intermediateResult.reserved_funds = '100';
      intermediateResult.participants_outcomes_batches = [
        {
          id: faker.string.uuid(),
          results: [
            generateParticipantOutcome({
              address: firstPlaceAddress,
              score: firstPlaceScore,
              total_volume: eligibleVolume,
            }),
            ...tiedSecondPlaceAddresses.map((address) =>
              generateParticipantOutcome({
                address,
                score: tiedSecondPlaceScore,
                total_volume: eligibleVolume,
              }),
            ),
            generateParticipantOutcome({
              address: seventhPlaceAddress,
              score: seventhPlaceScore,
              total_volume: eligibleVolume,
            }),
            generateParticipantOutcome({
              address: eighthPlaceAddress,
              score: eighthPlaceScore,
              total_volume: eligibleVolume,
            }),
          ],
        },
      ];

      const rewardsBatch = payoutsService[
        'calculateRewardsForCompetitiveIntermediateResult'
      ](
        intermediateResult,
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          pair: 'BTC/USDT',
          min_volume_required: minVolumeRequired,
          rewards_distribution: [50, 30, 20],
        } as CompetitiveCampaignManifest,
        18,
      );

      const rewardsByAddress = new Map(
        rewardsBatch.rewards.map((reward) => [reward.address, reward.amount]),
      );

      expect(rewardsBatch.rewards).toHaveLength(6);
      expect(rewardsByAddress.get(firstPlaceAddress)).toBe('50');
      for (const tiedAddress of tiedSecondPlaceAddresses) {
        expect(rewardsByAddress.get(tiedAddress)).toBe('10');
      }
      expect(rewardsByAddress.has(seventhPlaceAddress)).toBe(false);
      expect(rewardsByAddress.has(eighthPlaceAddress)).toBe(false);
    });

    it('should filter out participants below min_volume_required', () => {
      const firstPlaceAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const secondPlaceAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const thirdPlaceAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const minVolumeRequired = faker.number.int({ min: 100, max: 300 });
      const firstParticipantVolume =
        minVolumeRequired - faker.number.int({ min: 1, max: 50 });
      const secondParticipantVolume =
        minVolumeRequired + faker.number.int({ min: 10, max: 80 });
      const thirdParticipantVolume = minVolumeRequired;
      const baseScore = faker.number.int({ min: 90, max: 180 });
      const firstPlaceScore = baseScore;
      const secondPlaceScore = Math.floor(baseScore / 2);
      const thirdPlaceScore = Math.floor(baseScore / 3);

      const intermediateResult = generateIntermediateResult();
      intermediateResult.reserved_funds = '100';
      intermediateResult.participants_outcomes_batches = [
        {
          id: faker.string.uuid(),
          results: [
            generateParticipantOutcome({
              address: firstPlaceAddress,
              score: firstPlaceScore,
              total_volume: firstParticipantVolume,
            }),
            generateParticipantOutcome({
              address: secondPlaceAddress,
              score: secondPlaceScore,
              total_volume: secondParticipantVolume,
            }),
            generateParticipantOutcome({
              address: thirdPlaceAddress,
              score: thirdPlaceScore,
              total_volume: thirdParticipantVolume,
            }),
          ],
        },
      ];

      const rewardsBatch = payoutsService[
        'calculateRewardsForCompetitiveIntermediateResult'
      ](
        intermediateResult,
        {
          ...generateManifest('COMPETITIVE_MARKET_MAKING'),
          pair: 'BTC/USDT',
          min_volume_required: minVolumeRequired,
          rewards_distribution: [50, 30, 20],
        } as CompetitiveCampaignManifest,
        18,
      );

      expect(rewardsBatch.rewards).toEqual([
        { address: secondPlaceAddress, amount: '50' },
        { address: thirdPlaceAddress, amount: '30' },
      ]);
    });
  });

  describe('runPayoutsCycleForCampaign', () => {
    const mockedFeeParams = {
      maxFeePerGas: faker.number.bigInt({ min: 1 }),
      maxPriorityFeePerGas: faker.number.bigInt({ min: 1 }),
    };
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
    let spyOnCalculateRewardsBatches: jest.SpyInstance;

    const mockedGetEscrowBalance = jest.fn();
    const mockedGetEscrowReservedFunds = jest.fn();
    const mockedGetEscrowStatus = jest.fn();
    const mockedBulkPayOut = jest.fn();
    const mockedCompleteEscrow = jest.fn();
    const mockedCancelEscrow = jest.fn();

    let mockedCampaign: CampaignWithResults;
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

      spyOnCalculateRewardsBatches = jest.spyOn(
        payoutsService as any,
        'calculateRewardsBatches',
      );
    });

    afterAll(() => {
      spyOnRetrieveCampaignManifest.mockRestore();
      spyOnDownloadIntermediateResults.mockRestore();
      spyOnUploadFinalResults.mockRestore();
      spyOnGetBulkPayoutsCount.mockRestore();
      spyOnWriteRewardsBatchToFile.mockRestore();
      spyOnCalculateRewardsBatches.mockRestore();
    });

    beforeEach(() => {
      mockedCampaign = generateCampaign();

      spyOnCalculateRewardsBatches.mockImplementation(
        (
          _manifest: unknown,
          intermediateResultsData: IntermediateResultsData,
        ) => {
          const latestResult = intermediateResultsData.results.at(-1);
          const latestBatch =
            latestResult?.participants_outcomes_batches.at(-1);
          if (!latestBatch || latestBatch.results.length === 0) {
            return [];
          }

          return [
            {
              id: latestBatch.id,
              rewards: latestBatch.results.map(
                (result: { address: string }) => ({
                  address: result.address,
                  amount: mockedReservedFunds.toString(),
                }),
              ),
            },
          ];
        },
      );

      mockedEscrowClient.build.mockResolvedValue({
        getBalance: mockedGetEscrowBalance,
        getStatus: mockedGetEscrowStatus,
        getReservedFunds: mockedGetEscrowReservedFunds,
        bulkPayOut: mockedBulkPayOut,
        complete: mockedCompleteEscrow,
        cancel: mockedCancelEscrow,
      } as unknown as EscrowClient);

      mockWeb3Service.calculateTxFees.mockResolvedValue(mockedFeeParams);

      /**
       * Wrap to implementation to be able to override status for specific tests
       */
      mockedGetEscrowStatus.mockImplementationOnce(
        async () =>
          EscrowStatus[mockedCampaign.status as unknown as EscrowStatus],
      );

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

    it('should skip when campaign status mismatch', async () => {
      const testEscrowStatus = EscrowStatus.ToCancel;
      mockedGetEscrowStatus.mockReset().mockResolvedValueOnce(testEscrowStatus);
      const testCampaignStatus = EscrowStatus[EscrowStatus.Partial];
      mockedCampaign.status = testCampaignStatus;

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Campaign status mismatch, avoiding payouts',
        {
          campaignStatus: testCampaignStatus,
          escrowStatus: testEscrowStatus,
          escrowStatusString: EscrowStatus[testEscrowStatus],
        },
      );

      expect(spyOnGetBulkPayoutsCount).toHaveBeenCalledTimes(0);
      expect(spyOnUploadFinalResults).toHaveBeenCalledTimes(0);
      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    it('should cancel if cancellation requested before than start date from manifest', async () => {
      mockedCampaign.status = EscrowStatus[EscrowStatus.ToCancel];

      mockedGetEscrowStatus
        .mockReset()
        .mockResolvedValueOnce(EscrowStatus.ToCancel);

      const now = new Date();
      mockedCampaign.cancellationRequestedAt = now;
      spyOnRetrieveCampaignManifest.mockReset().mockResolvedValueOnce(
        Object.assign(generateManifest(), {
          start_date: new Date(now.valueOf() + 1).toISOString(),
        }),
      );

      jest.useFakeTimers({ now });

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      jest.useRealTimers();

      expect(spyOnDownloadIntermediateResults).toHaveBeenCalledTimes(0);
      expect(logger.info).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledWith(
        'Campaign cancellation requested before campaign started, cancelling',
      );

      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
      expect(mockedCancelEscrow).toHaveBeenCalledTimes(1);
      expect(mockedCancelEscrow).toHaveBeenCalledWith(mockedCampaign.address, {
        timeoutMs: mockWeb3ConfigService.escrowTxTimeout,
      });
    });

    it('should not cancel if cancellation not requested and campaign not started yet', async () => {
      const now = Date.now();
      spyOnRetrieveCampaignManifest.mockReset().mockResolvedValueOnce(
        Object.assign(generateManifest(), {
          start_date: new Date(now + 1).toISOString(),
        }),
      );

      jest.useFakeTimers({ now });

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      jest.useRealTimers();

      expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
      expect(spyOnDownloadIntermediateResults).toHaveBeenCalledTimes(1);
    });

    it('should gracefully handle incomplete intermediate results', async () => {
      spyOnDownloadIntermediateResults
        .mockReset()
        .mockResolvedValueOnce(generateIntermediateResultsData());

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error while running payouts cycle for campaign',
        new Error('Intermediate results are not recorded'),
      );

      expect(spyOnGetBulkPayoutsCount).toHaveBeenCalledTimes(0);
      expect(spyOnUploadFinalResults).toHaveBeenCalledTimes(0);
      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    it('should gracefully handle invalid reserved funds', async () => {
      mockedGetEscrowReservedFunds.mockReset().mockResolvedValueOnce(
        faker.number.int({
          max:
            Number(mockedIntermediateResult.reserved_funds) -
            faker.number.float({ min: 0.0000001 }),
        }),
      );

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error while running payouts cycle for campaign',
        new Error('Expected payouts amount higher than reserved funds'),
      );
      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    it('should run payouts and not attempt finish campaign if not ended', async () => {
      mockWeb3Service.getSigner.mockReturnValueOnce(mockedSigner);
      const latestNonce = faker.number.int();
      mockedSigner.getNonce.mockResolvedValueOnce(latestNonce);

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(mockedSigner.getNonce).toHaveBeenCalledTimes(1);
      expect(mockedSigner.getNonce).toHaveBeenCalledWith('latest');

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
          ...mockedFeeParams,
          nonce: latestNonce,
          timeoutMs: mockWeb3ConfigService.escrowTxTimeout,
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
        {
          lastResultsAt: mockedIntermediateResult.to.toISOString(),
          expectedFinalLastResultsAt: mockedManifest.end_date,
        },
      );

      expect(mockedGetEscrowReservedFunds).toHaveBeenCalledTimes(1);
      expect(mockedGetEscrowReservedFunds).toHaveBeenCalledWith(
        mockedCampaign.address,
      );

      expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    it('should skip already paid results', async () => {
      spyOnGetBulkPayoutsCount.mockReset().mockResolvedValueOnce(1);

      await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        'Skipped rewards batch as per bulkPayoutsCount',
        {
          batchId: mockedIntermediateResult.participants_outcomes_batches[0].id,
          batchTotalReward: expect.stringMatching(/^\d+(\.\d+)?$/),
        },
      );

      expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
      expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
      expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
    });

    describe('campaign finalization', () => {
      let manifest: BaseCampaignManifest;

      beforeEach(() => {
        manifest = generateManifest();
        manifest.end_date = mockedIntermediateResult.to.toISOString();
        spyOnRetrieveCampaignManifest
          .mockReset()
          .mockResolvedValueOnce(manifest);
      });

      it.each([
        EscrowStatus[EscrowStatus.Complete],
        EscrowStatus[EscrowStatus.Cancelled],
      ])(
        'should run payouts and skip finalization if auto-finalized with "%s" status',
        async (escrowStatusString) => {
          const escrowStatus =
            EscrowStatus[escrowStatusString as unknown as EscrowStatus];
          mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

          await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

          expect(logger.info).toHaveBeenCalledTimes(6);
          expect(logger.info).toHaveBeenCalledWith(
            'Campaign auto-finalized during payouts',
            {
              escrowStatus,
              escrowStatusString,
            },
          );

          expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
          expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
          expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
        },
      );

      it.each([
        EscrowStatus[EscrowStatus.Partial],
        EscrowStatus[EscrowStatus.Paid],
      ])(
        'should run payouts and complete campaign for "%s" status if not auto-finalized',
        async (escrowStatusString) => {
          const escrowStatus =
            EscrowStatus[escrowStatusString as unknown as EscrowStatus];
          mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

          await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

          expect(logger.info).toHaveBeenCalledTimes(7);
          expect(logger.info).toHaveBeenCalledWith(
            'Campaign finished, going to finalize',
            {
              lastResultsAt: mockedIntermediateResult.to.toISOString(),
              expectedFinalLastResultsAt: manifest.end_date,
            },
          );
          expect(logger.info).toHaveBeenCalledWith(
            'No more payouts expected for campaign, completing it',
            {
              escrowStatus,
              escrowStatusString,
            },
          );

          expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
          expect(mockedCompleteEscrow).toHaveBeenCalledTimes(1);
          expect(mockedCompleteEscrow).toHaveBeenCalledWith(
            mockedCampaign.address,
            {
              ...mockedFeeParams,
              timeoutMs: mockWeb3ConfigService.escrowTxTimeout,
            },
          );
          expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
        },
      );

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

      it('should complete if campaign has "zero" results', async () => {
        const mockedEscrowBalance = faker.number.bigInt({ min: 1 });
        mockedGetEscrowReservedFunds.mockReset().mockResolvedValueOnce(0);
        mockedIntermediateResult.reserved_funds = 0;
        mockedIntermediateResult.participants_outcomes_batches = [];

        /**
         * It's expected that for 0 results no payout made at all
         * so escrow is still in pending status.
         */
        const escrowStatus = EscrowStatus.Pending;
        mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);
        mockedGetEscrowBalance.mockResolvedValueOnce(mockedEscrowBalance);

        await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

        expect(logger.info).toHaveBeenCalledTimes(6);
        expect(logger.info).toHaveBeenCalledWith(
          'Campaign finished, going to finalize',
          {
            lastResultsAt: mockedIntermediateResult.to.toISOString(),
            expectedFinalLastResultsAt: manifest.end_date,
          },
        );
        expect(logger.info).toHaveBeenCalledWith(
          'No more payouts expected for campaign, completing it',
          {
            escrowStatus,
            escrowStatusString: EscrowStatus[escrowStatus],
          },
        );

        expect(mockedBulkPayOut).toHaveBeenCalledTimes(0);
        expect(mockedCompleteEscrow).toHaveBeenCalledTimes(1);
        expect(mockedCompleteEscrow).toHaveBeenCalledWith(
          mockedCampaign.address,
          {
            ...mockedFeeParams,
            timeoutMs: mockWeb3ConfigService.escrowTxTimeout,
          },
        );
        expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
      });

      it('should run payouts and cancel campaign if cancellation requested and all results paid', async () => {
        mockedCampaign.status = EscrowStatus[EscrowStatus.ToCancel];
        mockedCampaign.cancellationRequestedAt = mockedIntermediateResult.to;
        mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);

        await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

        expect(logger.info).toHaveBeenCalledTimes(7);
        expect(logger.info).toHaveBeenCalledWith(
          'Campaign finished, going to finalize',
          {
            lastResultsAt: mockedIntermediateResult.to.toISOString(),
            expectedFinalLastResultsAt: manifest.end_date,
          },
        );
        expect(logger.info).toHaveBeenCalledWith(
          'Campaign ended with cancellation request, cancelling it',
        );

        expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
        expect(mockedCancelEscrow).toHaveBeenCalledTimes(1);
        expect(mockedCancelEscrow).toHaveBeenCalledWith(
          mockedCampaign.address,
          {
            ...mockedFeeParams,
            timeoutMs: mockWeb3ConfigService.escrowTxTimeout,
          },
        );
        expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
      });

      it('should run payouts and not cancel campaign if cancellation requested and not all results paid', async () => {
        mockedCampaign.status = EscrowStatus[EscrowStatus.ToCancel];
        const cancellationRequestedAt = faker.date.recent({
          refDate: mockedIntermediateResult.to,
        });
        mockedCampaign.cancellationRequestedAt = cancellationRequestedAt;
        mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);

        await payoutsService.runPayoutsCycleForCampaign(mockedCampaign);

        expect(logger.info).toHaveBeenCalledTimes(6);
        expect(logger.info).toHaveBeenCalledWith(
          'Campaign not finished yet, skip completion',
          {
            lastResultsAt: mockedIntermediateResult.to.toISOString(),
            expectedFinalLastResultsAt: cancellationRequestedAt.toISOString(),
          },
        );

        expect(mockedBulkPayOut).toHaveBeenCalledTimes(1);
        expect(mockedCancelEscrow).toHaveBeenCalledTimes(0);
        expect(mockedCompleteEscrow).toHaveBeenCalledTimes(0);
      });
    });
  });
});
