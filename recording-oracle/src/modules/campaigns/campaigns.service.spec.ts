/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('@human-protocol/sdk', () => {
  const mockedSdk = jest.createMockFromModule<
    typeof import('@human-protocol/sdk')
  >('@human-protocol/sdk');

  return {
    ...mockedSdk,
    ESCROW_BULK_PAYOUT_MAX_ITEMS: 2,
  };
});
jest.mock('@/logger');

import crypto from 'crypto';

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  IEscrow,
  OrderDirection,
} from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import _ from 'lodash';

import dayjs from '@/common/utils/dayjs';
import * as escrowUtils from '@/common/utils/escrow';
import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { isUuidV4 } from '@/common/validators';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import {
  ExchangeApiAccessError,
  ExchangeApiClientError,
  ExchangeApiClientFactory,
} from '@/modules/exchange';
import {
  ExchangeApiKeyNotFoundError,
  ExchangeApiKeysService,
} from '@/modules/exchange-api-keys';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '@/modules/web3/fixtures';

import { CampaignEntity } from './campaign.entity';
import {
  CampaignAlreadyFinishedError,
  CampaignCancelledError,
  CampaignNotFoundError,
  CampaignNotStartedError,
  InvalidCampaign,
  UserIsNotParticipatingError,
} from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import {
  generateBaseCampaignManifest,
  generateCampaignEntity,
  generateCampaignManifest,
  generateCampaignProgress,
  generateHoldingCampaignManifest,
  generateIntermediateResult,
  generateIntermediateResultsData,
  generateMarketMakingCampaignManifest,
  generateParticipantOutcome,
  generateStoredResultsMeta,
  generateThresholdampaignManifest,
  MockCampaignProgressChecker,
  MockProgressCheckResult,
  generateCampaignParticipant,
} from './fixtures';
import * as manifestUtils from './manifest.utils';
import {
  CampaignProgressMeta,
  HoldingProgressChecker,
  MarketMakingProgressChecker,
} from './progress-checking';
import { HoldingMeta } from './progress-checking/holding';
import { MarketMakingMeta } from './progress-checking/market-making';
import {
  ThresholdMeta,
  ThresholdProgressChecker,
} from './progress-checking/threshold';
import {
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  HoldingCampaignDetails,
  IntermediateResultsData,
  MarketMakingCampaignDetails,
  ThresholdCampaignDetails,
} from './types';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatsRepository } from './volume-stats.repository';

const mockCampaignsRepository = createMock<CampaignsRepository>();
const mockUserCampaignsRepository = createMock<UserCampaignsRepository>();
const mockVolumeStatsRepository = createMock<VolumeStatsRepository>();
const mockExchangeApiKeysService = createMock<ExchangeApiKeysService>();
const mockStorageService = createMock<StorageService>();
const mockPgAdvisoryLock = createMock<PgAdvisoryLock>();

const mockWeb3Service = createMock<Web3Service>();
(mockWeb3Service.supportedChainIds as any) = [];

const mockedEscrowClient = jest.mocked(EscrowClient);
const mockedEscrowUtils = jest.mocked(EscrowUtils);

describe('CampaignsService', () => {
  let campaignsService: CampaignsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: CampaignsRepository,
          useValue: mockCampaignsRepository,
        },
        {
          provide: ExchangeApiKeysService,
          useValue: mockExchangeApiKeysService,
        },
        {
          provide: ExchangeApiClientFactory,
          useValue: createMock<ExchangeApiClientFactory>(),
        },
        {
          provide: UserCampaignsRepository,
          useValue: mockUserCampaignsRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: VolumeStatsRepository,
          useValue: mockVolumeStatsRepository,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        {
          provide: PgAdvisoryLock,
          useValue: mockPgAdvisoryLock,
        },
      ],
    }).compile();

    campaignsService = moduleRef.get<CampaignsService>(CampaignsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(campaignsService).toBeDefined();
  });

  describe('retrieveCampaignData', () => {
    const TEST_TOKEN_SYMBOL = faker.finance.currencyCode();
    const TEST_TOKEN_DECIMALS = faker.helpers.arrayElement([6, 18]);

    const mockedGetEscrowStatus = jest.fn();

    let spyOnDownloadCampaignManifest: jest.SpyInstance;
    let chainId: number;
    let campaignAddress: string;

    beforeAll(() => {
      spyOnDownloadCampaignManifest = jest.spyOn(
        manifestUtils,
        'downloadCampaignManifest',
      );
      spyOnDownloadCampaignManifest.mockImplementation();
    });

    afterAll(() => {
      spyOnDownloadCampaignManifest.mockRestore();
    });

    beforeEach(() => {
      chainId = generateTestnetChainId();
      campaignAddress = faker.finance.ethereumAddress();

      mockedEscrowClient.build.mockResolvedValue({
        getStatus: mockedGetEscrowStatus,
      } as unknown as EscrowClient);

      mockWeb3Service.getTokenSymbol.mockResolvedValue(TEST_TOKEN_SYMBOL);
      mockWeb3Service.getTokenDecimals.mockResolvedValue(TEST_TOKEN_DECIMALS);
    });

    it('should throw when escrow not found', async () => {
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(null);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(CampaignNotFoundError);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it('should throw when subgraph is missing fund token data', async () => {
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: '',
      } as IEscrow);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);
      expect(thrownError.details).toBe('Missing fund token data');

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it('should throw when subgraph is missing fund amount data', async () => {
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
      } as IEscrow);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);
      expect(thrownError.details).toBe('Invalid fund amount');

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it('should throw when fund amount data in subgraph is zero', async () => {
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: 0n,
      } as IEscrow);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);
      expect(thrownError.details).toBe('Invalid fund amount');

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it('should throw when subgraph is missing manifest url', async () => {
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: faker.helpers.arrayElement(['', null]),
        manifestHash: faker.string.hexadecimal(),
      } as IEscrow);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);
      expect(thrownError.details).toBe('Missing manifest data');

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it('should throw when subgraph is missing manifest hash', async () => {
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: faker.internet.url(),
        manifestHash: faker.helpers.arrayElement(['', null]),
      } as IEscrow);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);
      expect(thrownError.details).toBe('Missing manifest data');

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it('should throw when escrow is for different recording oracle', async () => {
      const escrowRecordingOracle = faker.finance.ethereumAddress();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: faker.internet.url(),
        manifestHash: faker.string.hexadecimal(),
        recordingOracle: escrowRecordingOracle,
      } as IEscrow);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);
      expect(thrownError.details).toBe(
        `Invalid recording oracle address: ${escrowRecordingOracle}`,
      );

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it.each([
      EscrowStatus[EscrowStatus.ToCancel],
      EscrowStatus[EscrowStatus.Cancelled],
      EscrowStatus[EscrowStatus.Complete],
    ])('should throw when escrow has "%s" status', async (escrowStatus) => {
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: faker.internet.url(),
        manifestHash: faker.string.hexadecimal(),
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as IEscrow);
      mockedGetEscrowStatus.mockResolvedValueOnce(
        EscrowStatus[escrowStatus as unknown as EscrowStatus],
      );

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);
      expect(thrownError.details).toBe(`Invalid status: ${escrowStatus}`);

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );

      expect(mockedGetEscrowStatus).toHaveBeenCalledWith(campaignAddress);
    });

    it('should log and throw when fails to download manifest', async () => {
      const manifestUrl = faker.internet.url();
      const manifestHash = faker.string.hexadecimal();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as IEscrow);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const syntheticError = new Error(faker.lorem.sentence());
      spyOnDownloadCampaignManifest.mockRejectedValueOnce(syntheticError);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to download campaign manifest',
        syntheticError,
      );

      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledTimes(1);
      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledWith(
        manifestUrl,
        manifestHash,
      );
    });

    it('should throw when invalid base manifest schema', async () => {
      const manifest = generateBaseCampaignManifest();
      delete (manifest as any).type;

      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: JSON.stringify(manifest),
        manifestHash: faker.string.hexadecimal(),
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as IEscrow);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);

      expect(thrownError.details).toBe('Invalid manifest schema');
    });

    it('should throw when exchange from manifest not supported', async () => {
      const manifestUrl = faker.internet.url();
      const manifestHash = faker.string.hexadecimal();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as IEscrow);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateBaseCampaignManifest();
      mockedManifest.exchange = faker.string.sample();
      spyOnDownloadCampaignManifest.mockResolvedValueOnce(
        JSON.stringify(mockedManifest),
      );

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);

      expect(thrownError.details).toBe(
        `Exchange not supported: ${mockedManifest.exchange}`,
      );
    });

    it('should throw when campaign type from manifest not supported', async () => {
      const manifestUrl = faker.internet.url();
      const manifestHash = faker.string.hexadecimal();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt({ min: 1 }),
        manifest: manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as IEscrow);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateBaseCampaignManifest();
      mockedManifest.type = faker.string.sample();
      spyOnDownloadCampaignManifest.mockResolvedValueOnce(
        JSON.stringify(mockedManifest),
      );

      let thrownError;
      try {
        await campaignsService['retrieveCampaignData'](
          chainId,
          campaignAddress,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaignAddress);

      expect(thrownError.details).toBe(
        `Campaign type not supported: ${mockedManifest.type}`,
      );
    });

    it.each([
      generateMarketMakingCampaignManifest(),
      generateHoldingCampaignManifest(),
      generateThresholdampaignManifest(),
    ])(
      'should retrieve and return data (manifest url) [%#]',
      async (mockedManifest) => {
        const manifestUrl = faker.internet.url();
        const manifestHash = faker.string.hexadecimal();
        const totalFundedAmount = faker.number.bigInt({ min: 1 });
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          token: faker.finance.ethereumAddress(),
          totalFundedAmount,
          manifest: manifestUrl,
          manifestHash,
          recordingOracle: mockWeb3ConfigService.operatorAddress,
        } as IEscrow);
        mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

        spyOnDownloadCampaignManifest.mockResolvedValueOnce(
          JSON.stringify(mockedManifest),
        );

        const { manifest, escrowInfo } = await campaignsService[
          'retrieveCampaignData'
        ](chainId, campaignAddress);

        expect(manifest).toEqual(mockedManifest);
        expect(escrowInfo).toEqual({
          fundAmount: Number(
            ethers.formatUnits(totalFundedAmount, TEST_TOKEN_DECIMALS),
          ),
          fundTokenSymbol: TEST_TOKEN_SYMBOL,
          fundTokenDecimals: TEST_TOKEN_DECIMALS,
        });

        expect(spyOnDownloadCampaignManifest).toHaveBeenCalledTimes(1);
        expect(spyOnDownloadCampaignManifest).toHaveBeenCalledWith(
          manifestUrl,
          manifestHash,
        );
      },
    );

    it.each([
      generateMarketMakingCampaignManifest(),
      generateHoldingCampaignManifest(),
      generateThresholdampaignManifest(),
    ])(
      'should retrieve and return data (manifest json) [%#]',
      async (mockedManifest) => {
        const totalFundedAmount = faker.number.bigInt({ min: 1 });
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          token: faker.finance.ethereumAddress(),
          totalFundedAmount,
          manifest: JSON.stringify(mockedManifest),
          manifestHash: faker.string.hexadecimal(),
          recordingOracle: mockWeb3ConfigService.operatorAddress,
        } as IEscrow);
        mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

        const { manifest, escrowInfo } = await campaignsService[
          'retrieveCampaignData'
        ](chainId, campaignAddress);

        expect(manifest).toEqual(mockedManifest);
        expect(escrowInfo).toEqual({
          fundAmount: Number(
            ethers.formatUnits(totalFundedAmount, TEST_TOKEN_DECIMALS),
          ),
          fundTokenSymbol: TEST_TOKEN_SYMBOL,
          fundTokenDecimals: TEST_TOKEN_DECIMALS,
        });

        expect(spyOnDownloadCampaignManifest).not.toHaveBeenCalled();
      },
    );
  });

  describe('createCampaign', () => {
    it('should create market making campaign with proper data', async () => {
      const chainId = generateTestnetChainId();
      const campaignAddress = faker.finance.ethereumAddress();
      const manifest = generateMarketMakingCampaignManifest();
      const fundAmount = faker.number.float();
      const fundTokenSymbol = faker.finance.currencyCode();
      const fundTokenDecimals = faker.number.int({ min: 6, max: 18 });

      const campaign = await campaignsService.createCampaign(
        chainId,
        campaignAddress,
        manifest,
        {
          fundAmount,
          fundTokenSymbol,
          fundTokenDecimals,
        },
      );

      expect(isUuidV4(campaign.id)).toBe(true);

      const expectedCampaignData = {
        id: expect.any(String),
        chainId,
        address: ethers.getAddress(campaignAddress),
        type: manifest.type,
        exchangeName: manifest.exchange,
        symbol: manifest.pair,
        startDate: manifest.start_date,
        endDate: manifest.end_date,
        fundAmount: fundAmount.toString(),
        fundToken: fundTokenSymbol,
        fundTokenDecimals,
        details: {
          dailyVolumeTarget: manifest.daily_volume_target,
        },
        status: 'active',
        lastResultsAt: null,
      };
      expect(campaign).toEqual(expectedCampaignData);

      expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.insert).toHaveBeenCalledWith(
        expectedCampaignData,
      );
    });

    it('should create holding campaign with proper data', async () => {
      const chainId = generateTestnetChainId();
      const campaignAddress = faker.finance.ethereumAddress();
      const manifest = generateHoldingCampaignManifest();
      const fundAmount = faker.number.float();
      const fundTokenSymbol = faker.finance.currencyCode();
      const fundTokenDecimals = faker.number.int({ min: 6, max: 18 });

      const campaign = await campaignsService.createCampaign(
        chainId,
        campaignAddress,
        manifest,
        {
          fundAmount,
          fundTokenSymbol,
          fundTokenDecimals,
        },
      );

      expect(isUuidV4(campaign.id)).toBe(true);

      const expectedCampaignData = {
        id: expect.any(String),
        chainId,
        address: ethers.getAddress(campaignAddress),
        type: manifest.type,
        exchangeName: manifest.exchange,
        symbol: manifest.symbol,
        startDate: manifest.start_date,
        endDate: manifest.end_date,
        fundAmount: fundAmount.toString(),
        fundToken: fundTokenSymbol,
        fundTokenDecimals,
        details: {
          dailyBalanceTarget: manifest.daily_balance_target,
        },
        status: 'active',
        lastResultsAt: null,
      };
      expect(campaign).toEqual(expectedCampaignData);

      expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.insert).toHaveBeenCalledWith(
        expectedCampaignData,
      );
    });

    it('should create threshold campaign with proper data', async () => {
      const chainId = generateTestnetChainId();
      const campaignAddress = faker.finance.ethereumAddress();
      const manifest = generateThresholdampaignManifest();
      const fundAmount = faker.number.float();
      const fundTokenSymbol = faker.finance.currencyCode();
      const fundTokenDecimals = faker.number.int({ min: 6, max: 18 });

      const campaign = await campaignsService.createCampaign(
        chainId,
        campaignAddress,
        manifest,
        {
          fundAmount,
          fundTokenSymbol,
          fundTokenDecimals,
        },
      );

      expect(isUuidV4(campaign.id)).toBe(true);

      const expectedCampaignData = {
        id: expect.any(String),
        chainId,
        address: ethers.getAddress(campaignAddress),
        type: manifest.type,
        exchangeName: manifest.exchange,
        symbol: manifest.symbol,
        startDate: manifest.start_date,
        endDate: manifest.end_date,
        fundAmount: fundAmount.toString(),
        fundToken: fundTokenSymbol,
        fundTokenDecimals,
        details: {
          minimumBalanceTarget: manifest.minimum_balance_target,
        },
        status: 'active',
        lastResultsAt: null,
      };
      expect(campaign).toEqual(expectedCampaignData);

      expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.insert).toHaveBeenCalledWith(
        expectedCampaignData,
      );
    });
  });

  describe('join', () => {
    let campaign: CampaignEntity;
    let userId: string;
    let chainId: number;

    const mockedGetEscrowStatus = jest.fn();

    beforeEach(() => {
      campaign = generateCampaignEntity();
      userId = faker.string.uuid();
      chainId = generateTestnetChainId();

      mockedEscrowClient.build.mockResolvedValue({
        getStatus: mockedGetEscrowStatus,
      } as unknown as EscrowClient);
    });

    it('should return campaign id if exists and user already joined', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        true,
      );

      const id = await campaignsService.join(
        userId,
        chainId,
        // not checksummed address
        campaign.address.toLowerCase(),
      );

      expect(id).toBe(campaign.id);

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it('should re-throw error when exchange api keys not authorized for exchange from campaign', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        false,
      );
      const testError = new Error(faker.lorem.sentence());
      mockExchangeApiKeysService.assertUserHasAuthorizedKeys.mockRejectedValueOnce(
        testError,
      );

      let thrownError;
      try {
        await campaignsService.join(userId, chainId, campaign.address);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBe(testError);
    });

    it('should create campaign when not exist and join user', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const campaignAddress = faker.finance.ethereumAddress();
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        null,
      );

      const spyOnretrieveCampaignData = jest
        .spyOn(campaignsService as any, 'retrieveCampaignData')
        .mockImplementation();
      const spyOnCreateCampaign = jest.spyOn(
        campaignsService,
        'createCampaign',
      );
      const campaignManifest = generateCampaignManifest();
      const escrowInfo = {
        fundAmount: faker.number.float(),
        fundTokenSymbol: faker.finance.currencyCode(),
      };
      spyOnretrieveCampaignData.mockResolvedValueOnce({
        manifest: campaignManifest,
        escrowInfo,
      });

      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        false,
      );
      mockExchangeApiKeysService.assertUserHasAuthorizedKeys.mockResolvedValueOnce(
        faker.string.uuid(),
      );

      const now = new Date();
      jest.useFakeTimers({ now });

      const campaignId = await campaignsService.join(
        userId,
        chainId,
        campaignAddress,
      );

      jest.useRealTimers();

      expect(isUuidV4(campaignId)).toBe(true);

      expect(spyOnretrieveCampaignData).toHaveBeenCalledTimes(1);
      expect(spyOnretrieveCampaignData).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );

      expect(spyOnCreateCampaign).toHaveBeenCalledTimes(1);
      expect(spyOnCreateCampaign).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
        campaignManifest,
        escrowInfo,
      );

      expect(mockUserCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockUserCampaignsRepository.insert).toHaveBeenCalledWith({
        userId,
        campaignId,
        createdAt: now,
      });

      spyOnretrieveCampaignData.mockRestore();
      spyOnCreateCampaign.mockRestore();
    });

    it('should throw when joining campaign that reached its end date', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Partial);

      campaign.endDate = faker.date.past();
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );

      let thrownError;
      try {
        await campaignsService.join(userId, chainId, campaign.address);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(CampaignAlreadyFinishedError);
      expect(thrownError.chainId).toBe(campaign.chainId);
      expect(thrownError.address).toBe(campaign.address);

      expect(mockUserCampaignsRepository.insert).toHaveBeenCalledTimes(0);
    });

    it.each([
      [EscrowStatus.ToCancel, CampaignCancelledError],
      [EscrowStatus.Cancelled, CampaignCancelledError],
      [EscrowStatus.Complete, CampaignAlreadyFinishedError],
    ])(
      'should throw when campaign status mismatches escrow: [%#]',
      async (escrowStatus, errorClass) => {
        mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
          campaign,
        );
        mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

        let thrownError;
        try {
          await campaignsService.join(userId, chainId, campaign.address);
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(errorClass);
        expect(thrownError.chainId).toBe(campaign.chainId);
        expect(thrownError.address).toBe(campaign.address);

        expect(mockUserCampaignsRepository.insert).toHaveBeenCalledTimes(0);
      },
    );
  });

  describe('getJoined', () => {
    it('should return data of campaigns where user is participant', async () => {
      const userId = faker.string.uuid();
      const userCampaigns = Array.from({ length: 3 }, () =>
        generateCampaignEntity(),
      );
      mockUserCampaignsRepository.findByUserId.mockResolvedValueOnce(
        userCampaigns,
      );
      const testStatus = faker.string.sample();
      const testLimit = faker.number.int();
      const testSkip = faker.number.int();

      const campaigns = await campaignsService.getJoined(userId, {
        statuses: [testStatus as CampaignStatus],
        limit: testLimit,
        skip: testSkip,
      });

      expect(campaigns).toEqual(userCampaigns);
      expect(mockUserCampaignsRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(mockUserCampaignsRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        {
          statuses: [testStatus],
          limit: testLimit,
          skip: testSkip,
        },
      );
    });
  });

  describe('getCampaignProgressChecker', () => {
    it('should return market making checker for its type', () => {
      const campaign = generateCampaignEntity(CampaignType.MARKET_MAKING);

      const checker = campaignsService['getCampaignProgressChecker'](
        campaign.type,
        {
          exchangeName: campaign.exchangeName,
          symbol: campaign.symbol,
          periodStart: faker.date.recent(),
          periodEnd: faker.date.soon(),
        },
      );

      expect(checker).toBeInstanceOf(MarketMakingProgressChecker);
    });

    it('should return holding checker for its type', () => {
      const campaign = generateCampaignEntity(CampaignType.HOLDING);

      const checker = campaignsService['getCampaignProgressChecker'](
        campaign.type,
        {
          exchangeName: campaign.exchangeName,
          symbol: campaign.symbol,
          periodStart: faker.date.recent(),
          periodEnd: faker.date.soon(),
        },
      );

      expect(checker).toBeInstanceOf(HoldingProgressChecker);
    });

    it('should return threshold checker for its type', () => {
      const campaign = generateCampaignEntity(CampaignType.THRESHOLD);

      const checker = campaignsService['getCampaignProgressChecker'](
        campaign.type,
        {
          exchangeName: campaign.exchangeName,
          symbol: campaign.symbol,
          periodStart: faker.date.recent(),
          periodEnd: faker.date.soon(),
          minimumBalanceTarget: faker.number.float(),
        },
      );

      expect(checker).toBeInstanceOf(ThresholdProgressChecker);
    });

    it('should throw for unknown campaign type', () => {
      const campaign = generateCampaignEntity();
      campaign.type = faker.string.sample() as any;

      let thrownError;
      try {
        campaignsService['getCampaignProgressChecker'](campaign.type, {
          exchangeName: campaign.exchangeName,
          symbol: campaign.symbol,
          periodStart: faker.date.recent(),
          periodEnd: faker.date.soon(),
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        `No progress checker for ${campaign.type} campaign`,
      );
    });
  });

  describe('retrieveCampaignIntermediateResults', () => {
    const mockGetIntermediateResultsUrl = jest.fn();
    let spyOnDownloadFile: jest.SpyInstance;
    let campaign: CampaignEntity;

    beforeAll(() => {
      spyOnDownloadFile = jest.spyOn(httpUtils, 'downloadFile');
      spyOnDownloadFile.mockImplementation();

      campaign = generateCampaignEntity();
    });

    afterAll(() => {
      spyOnDownloadFile.mockRestore();
    });

    beforeEach(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getIntermediateResultsUrl: mockGetIntermediateResultsUrl,
      } as unknown as EscrowClient);
    });

    it('should return null if no results url in escrow', async () => {
      mockGetIntermediateResultsUrl.mockResolvedValueOnce(null);

      const results =
        await campaignsService['retrieveCampaignIntermediateResults'](campaign);

      expect(results).toBe(null);
    });

    it('should rethrow download error', async () => {
      const testUrl = faker.internet.url();
      mockGetIntermediateResultsUrl.mockResolvedValueOnce(testUrl);

      const testError = new Error(faker.lorem.sentence());
      spyOnDownloadFile.mockRejectedValueOnce(testError);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignIntermediateResults'](campaign);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toEqual(testError);
      expect(spyOnDownloadFile).toHaveBeenCalledTimes(1);
      expect(spyOnDownloadFile).toHaveBeenCalledWith(testUrl);
    });

    it('should download intermediate results', async () => {
      const testUrl = faker.internet.url();
      mockGetIntermediateResultsUrl.mockResolvedValueOnce(testUrl);

      const mockIntermediateResulsData = generateIntermediateResultsData();
      spyOnDownloadFile.mockResolvedValueOnce(
        Buffer.from(JSON.stringify(mockIntermediateResulsData)),
      );

      const intermediateResultsData =
        await campaignsService['retrieveCampaignIntermediateResults'](campaign);

      expect(intermediateResultsData).toEqual(mockIntermediateResulsData);
      expect(spyOnDownloadFile).toHaveBeenCalledTimes(1);
      expect(spyOnDownloadFile).toHaveBeenCalledWith(testUrl);
    });
  });

  describe('recordCampaignIntermediateResults', () => {
    const mockStoreResults = jest.fn();

    beforeEach(() => {
      mockedEscrowClient.build.mockResolvedValue({
        storeResults: mockStoreResults,
      } as unknown as EscrowClient);
    });

    it('should upload results to storage and store url in escrow', async () => {
      const mockedResultsFileUrl = faker.internet.url();
      mockStorageService.uploadData.mockResolvedValueOnce(mockedResultsFileUrl);

      const mockGasPrice = faker.number.bigInt({ min: 1 });
      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(mockGasPrice);

      const intermediateResultsData = generateIntermediateResultsData();
      const stringifiedResultsData = JSON.stringify(intermediateResultsData);

      const resultsHash = crypto
        .createHash('sha256')
        .update(stringifiedResultsData)
        .digest('hex');
      const fundsToReserve = faker.number.bigInt({ min: 1 });
      const recordingResult = await campaignsService[
        'recordCampaignIntermediateResults'
      ](intermediateResultsData, fundsToReserve);

      expect(recordingResult.url).toBe(mockedResultsFileUrl);
      expect(recordingResult.hash).toBe(resultsHash);

      expect(mockStorageService.uploadData).toHaveBeenCalledTimes(1);
      expect(mockStorageService.uploadData).toHaveBeenCalledWith(
        stringifiedResultsData,
        `${intermediateResultsData.address}/${resultsHash}.json`,
        'application/json',
      );

      expect(mockStoreResults).toHaveBeenCalledTimes(1);
      expect(mockStoreResults).toHaveBeenCalledWith(
        intermediateResultsData.address,
        mockedResultsFileUrl,
        resultsHash,
        fundsToReserve,
        {
          gasPrice: mockGasPrice,
        },
      );
    });
  });

  describe('checkCampaignProgressForPeriod', () => {
    const mockCampaignProgressMetaProp = faker.lorem.slug();
    let mockCampaignProgressMetaValue: number;

    const mockCampaignProgressChecker = new MockCampaignProgressChecker();

    let spyOnGetCampaignProgressChecker: jest.SpyInstance;

    let periodStart: Date;
    let periodEnd: Date;
    let campaign: CampaignEntity;
    let mockParticipantResult: MockProgressCheckResult;

    beforeAll(() => {
      periodEnd = new Date();
      periodStart = dayjs(periodEnd).subtract(1, 'day').toDate();
      campaign = generateCampaignEntity();

      mockParticipantResult = {
        abuseDetected: false,
        score: faker.number.float(),
        [mockCampaignProgressMetaProp]: faker.number.float(),
      };

      spyOnGetCampaignProgressChecker = jest.spyOn(
        campaignsService as any,
        'getCampaignProgressChecker',
      );
    });

    afterAll(() => {
      spyOnGetCampaignProgressChecker.mockRestore();
    });

    beforeEach(() => {
      mockCampaignProgressChecker.checkForParticipant.mockResolvedValue(
        mockParticipantResult,
      );

      mockCampaignProgressMetaValue = faker.number.float();
      mockCampaignProgressChecker.getCollectedMeta.mockReturnValueOnce({
        [mockCampaignProgressMetaProp]: mockCampaignProgressMetaValue,
      });

      mockExchangeApiKeysService.retrieve.mockImplementation(
        async (userId) => ({
          id: faker.string.uuid(),
          apiKey: `${userId}-apiKey`,
          secretKey: `${userId}-secretKey`,
        }),
      );

      spyOnGetCampaignProgressChecker.mockReturnValueOnce(
        mockCampaignProgressChecker,
      );
    });

    it('should run with correct child logger', async () => {
      const spyOnLoggerChild = jest.spyOn(logger, 'child');

      try {
        await campaignsService.checkCampaignProgressForPeriod(
          campaign,
          periodStart,
          periodEnd,
        );

        expect(logger.child).toHaveBeenCalledTimes(1);
        expect(logger.child).toHaveBeenCalledWith({
          action: 'checkCampaignProgressForPeriod',
          caller: 'Object.<anonymous>',
          campaignId: campaign.id,
          chainId: campaign.chainId,
          campaignAddress: campaign.address,
          exchangeName: campaign.exchangeName,
          startDate: periodStart,
          endDate: periodEnd,
        });
      } finally {
        spyOnLoggerChild.mockRestore();
      }
    });

    it.each([
      CampaignType.MARKET_MAKING,
      CampaignType.HOLDING,
      CampaignType.THRESHOLD,
    ])(
      'should call getCampaignProgressChecker with correct parameters for "%s" campaign',
      async (campaignType) => {
        const campaign = generateCampaignEntity(campaignType);
        await campaignsService.checkCampaignProgressForPeriod(
          campaign,
          periodStart,
          periodEnd,
        );

        expect(spyOnGetCampaignProgressChecker).toHaveBeenCalledTimes(1);
        expect(spyOnGetCampaignProgressChecker).toHaveBeenCalledWith(
          campaign.type,
          {
            exchangeName: campaign.exchangeName,
            periodStart,
            periodEnd,
            symbol: campaign.symbol,
            ...campaign.details,
          },
        );
      },
    );

    it('should return results in correct format', async () => {
      const participant = generateCampaignParticipant(campaign);
      mockUserCampaignsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [participant],
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
      );

      expect(progress.from).toBe(periodStart.toISOString());
      expect(progress.to).toBe(periodEnd.toISOString());
      expect(progress.meta).toEqual({
        [mockCampaignProgressMetaProp]: mockCampaignProgressMetaValue,
      });
      expect(progress.participants_outcomes).toEqual([
        {
          address: participant.evmAddress,
          score: mockParticipantResult.score,
          [mockCampaignProgressMetaProp]:
            mockParticipantResult[mockCampaignProgressMetaProp],
        },
      ]);
    });

    it('should calculate results for each participant', async () => {
      const participants = [
        generateCampaignParticipant(campaign),
        generateCampaignParticipant(campaign),
      ];
      mockUserCampaignsRepository.findCampaignParticipants.mockResolvedValueOnce(
        participants,
      );

      await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
      );

      for (const { id: participantId, joinedAt } of participants) {
        expect(mockExchangeApiKeysService.retrieve).toHaveBeenCalledWith(
          participantId,
          campaign.exchangeName,
        );
        expect(
          mockCampaignProgressChecker.checkForParticipant,
        ).toHaveBeenCalledWith(
          {
            apiKey: `${participantId}-apiKey`,
            secret: `${participantId}-secretKey`,
          },
          joinedAt,
        );
      }
    });

    it('should skip participant results if abuse detected', async () => {
      const abuseParticipant = generateCampaignParticipant(campaign);
      const normalParticipant = generateCampaignParticipant(campaign);
      mockUserCampaignsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [abuseParticipant, normalParticipant],
      );

      const normalParticipantResult = {
        abuseDetected: false,
        score: faker.number.float(),
        [mockCampaignProgressMetaProp]: faker.number.float(),
      };
      mockCampaignProgressChecker.checkForParticipant.mockResolvedValueOnce({
        abuseDetected: true,
        score: 0,
      });
      mockCampaignProgressChecker.checkForParticipant.mockResolvedValueOnce(
        normalParticipantResult,
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
      );

      expect(progress.meta).toEqual({
        [mockCampaignProgressMetaProp]: mockCampaignProgressMetaValue,
      });
      expect(progress.participants_outcomes).toEqual([
        {
          address: normalParticipant.evmAddress,
          score: normalParticipantResult.score,
          [mockCampaignProgressMetaProp]:
            normalParticipantResult[mockCampaignProgressMetaProp],
        },
      ]);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Abuse detected. Skipping participant outcome',
        {
          participantId: abuseParticipant.id,
        },
      );
    });

    it('should skip participant if it does not have valid api key', async () => {
      const normalParticipant = generateCampaignParticipant(campaign);
      const noApiKeyParticipant = generateCampaignParticipant(campaign);
      mockUserCampaignsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [normalParticipant, noApiKeyParticipant],
      );
      mockExchangeApiKeysService.retrieve.mockImplementation(
        async (userId, exchangeName) => {
          if (userId === normalParticipant.id) {
            return {
              id: faker.string.uuid(),
              apiKey: `${userId}-apiKey`,
              secretKey: `${userId}-secretKey`,
            };
          }

          throw new ExchangeApiKeyNotFoundError(userId, exchangeName);
        },
      );

      const mockedParticipantsResult = {
        abuseDetected: false,
        score: faker.number.float(),
        [mockCampaignProgressMetaProp]: faker.number.float(),
      };
      mockCampaignProgressChecker.checkForParticipant.mockResolvedValueOnce(
        mockedParticipantsResult,
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
      );

      expect(progress.meta).toEqual({
        [mockCampaignProgressMetaProp]: mockCampaignProgressMetaValue,
      });
      expect(progress.participants_outcomes).toEqual([
        {
          address: normalParticipant.evmAddress,
          score: mockedParticipantsResult.score,
          [mockCampaignProgressMetaProp]:
            mockedParticipantsResult[mockCampaignProgressMetaProp],
        },
      ]);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Participant lacks valid api key',
        {
          participantId: noApiKeyParticipant.id,
        },
      );
    });

    it('should skip participant if it lacks exchange api access', async () => {
      const normalParticipant = generateCampaignParticipant(campaign);
      const noAccessParticipant = generateCampaignParticipant(campaign);
      mockUserCampaignsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [normalParticipant, noAccessParticipant],
      );

      const normalParticipantResult = {
        abuseDetected: false,
        score: faker.number.float(),
        [mockCampaignProgressMetaProp]: faker.number.float(),
      };
      mockCampaignProgressChecker.checkForParticipant.mockResolvedValueOnce(
        normalParticipantResult,
      );
      const syntheticError = new ExchangeApiAccessError(
        `Api access failed for fetch_test_${faker.lorem.word()}`,
        faker.lorem.sentence(),
      );
      mockCampaignProgressChecker.checkForParticipant.mockRejectedValueOnce(
        syntheticError,
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
      );

      expect(progress.meta).toEqual({
        [mockCampaignProgressMetaProp]: mockCampaignProgressMetaValue,
      });
      expect(progress.participants_outcomes).toEqual([
        {
          address: normalParticipant.evmAddress,
          score: normalParticipantResult.score,
          [mockCampaignProgressMetaProp]:
            normalParticipantResult[mockCampaignProgressMetaProp],
        },
      ]);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Participant lacks necessary exchange API access',
        {
          participantId: noAccessParticipant.id,
          error: syntheticError,
        },
      );
    });

    it('should throw if should retry some participant', async () => {
      mockUserCampaignsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [
          generateCampaignParticipant(campaign),
          generateCampaignParticipant(campaign),
        ],
      );

      mockCampaignProgressChecker.checkForParticipant.mockResolvedValueOnce({
        abuseDetected: false,
        score: faker.number.float(),
      });
      const syntheticError = new ExchangeApiClientError(faker.lorem.sentence());
      mockCampaignProgressChecker.checkForParticipant.mockRejectedValueOnce(
        syntheticError,
      );

      let thrownError;
      try {
        await campaignsService.checkCampaignProgressForPeriod(
          campaign,
          periodStart,
          periodEnd,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toEqual(syntheticError);
    });
  });

  describe('recordCampaignProgress', () => {
    let spyOnRetrieveCampaignIntermediateResults: jest.SpyInstance;
    let spyOnCheckCampaignProgressForPeriod: jest.SpyInstance;
    let spyOnRecordCampaignIntermediateResults: jest.SpyInstance;
    let spyOnRecordGeneratedVolume: jest.SpyInstance;
    let spyOnGetCancellationRequestDate: jest.SpyInstance;
    let campaign: CampaignEntity;

    const mockedGetEscrowStatus = jest.fn();

    beforeAll(() => {
      spyOnRetrieveCampaignIntermediateResults = jest.spyOn(
        campaignsService as any,
        'retrieveCampaignIntermediateResults',
      );
      spyOnRetrieveCampaignIntermediateResults.mockImplementation();

      spyOnCheckCampaignProgressForPeriod = jest.spyOn(
        campaignsService,
        'checkCampaignProgressForPeriod',
      );
      spyOnCheckCampaignProgressForPeriod.mockImplementation();

      spyOnRecordCampaignIntermediateResults = jest.spyOn(
        campaignsService as any,
        'recordCampaignIntermediateResults',
      );
      spyOnRecordCampaignIntermediateResults.mockImplementation();

      spyOnRecordGeneratedVolume = jest.spyOn(
        campaignsService as any,
        'recordGeneratedVolume',
      );
      spyOnRecordGeneratedVolume.mockImplementation();

      spyOnGetCancellationRequestDate = jest.spyOn(
        escrowUtils,
        'getCancellationRequestDate',
      );
      spyOnGetCancellationRequestDate.mockImplementation();
    });

    afterAll(() => {
      spyOnRetrieveCampaignIntermediateResults.mockRestore();
      spyOnCheckCampaignProgressForPeriod.mockRestore();
      spyOnRecordCampaignIntermediateResults.mockRestore();
      spyOnRecordGeneratedVolume.mockRestore();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();

      /**
       * Adjust campaign dates to easily manipulate if its "ongoing"
       * and already recorded intermediate results
       */
      const nDaysToShift = faker.number.int({ min: 3, max: 5 });
      campaign.startDate = dayjs().subtract(nDaysToShift, 'day').toDate();
      campaign.endDate = dayjs().add(nDaysToShift, 'day').toDate();

      mockPgAdvisoryLock.withLock.mockImplementationOnce(async (_key, fn) => {
        await fn();
      });

      mockedEscrowClient.build.mockResolvedValue({
        getStatus: mockedGetEscrowStatus,
      } as unknown as EscrowClient);
    });

    it('should run with pessimistic lock and correct child logger', async () => {
      const spyOnLoggerChild = jest.spyOn(logger, 'child');

      try {
        await campaignsService.recordCampaignProgress(campaign);

        expect(mockPgAdvisoryLock.withLock).toHaveBeenCalledTimes(1);
        expect(mockPgAdvisoryLock.withLock).toHaveBeenCalledWith(
          `record-campaign-progress:${campaign.id}`,
          expect.any(Function),
        );

        expect(logger.child).toHaveBeenCalledTimes(1);
        expect(logger.child).toHaveBeenCalledWith({
          action: 'recordCampaignProgress',
          campaignId: campaign.id,
          chainId: campaign.chainId,
          campaignAddress: campaign.address,
          exchangeName: campaign.exchangeName,
          symbol: campaign.symbol,
          type: campaign.type,
        });

        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(logger.debug).toHaveBeenNthCalledWith(
          1,
          'Campaign progress recording started',
        );
        expect(logger.debug).toHaveBeenNthCalledWith(
          2,
          'Campaign progress recording finished',
        );
      } finally {
        spyOnLoggerChild.mockRestore();
      }
    });

    describe('error handling and logging', () => {
      const EXPECTED_ERROR_MESSAGE =
        'Failure while recording campaign progress';

      it('should log errors when fails to get intermediate results', async () => {
        const syntheticError = new Error(faker.lorem.words());
        spyOnRetrieveCampaignIntermediateResults.mockRejectedValueOnce(
          syntheticError,
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
          EXPECTED_ERROR_MESSAGE,
          syntheticError,
        );
      });

      it('should log errors when fails to check campaign progress', async () => {
        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

        const syntheticError = new Error(faker.lorem.words());
        spyOnCheckCampaignProgressForPeriod.mockRejectedValueOnce(
          syntheticError,
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
          EXPECTED_ERROR_MESSAGE,
          syntheticError,
        );
      });

      it('should log errors when fails to record intermediate results', async () => {
        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
        spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
          generateCampaignProgress(campaign),
        );

        const syntheticError = new Error(faker.lorem.words());
        spyOnRecordCampaignIntermediateResults.mockRejectedValueOnce(
          syntheticError,
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
          EXPECTED_ERROR_MESSAGE,
          syntheticError,
        );
      });

      it('should log errors when fails to calc reward pool for unknown campaign', async () => {
        campaign.type = faker.string.sample() as any;

        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

        const campaignProgress = generateCampaignProgress(campaign);
        spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
          campaignProgress,
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
          EXPECTED_ERROR_MESSAGE,
          new Error(
            `Unknown campaign type for reward pool calculation: ${campaign.type}`,
          ),
        );
      });
    });

    it.each(
      Object.values(CampaignStatus).filter(
        (s) =>
          [CampaignStatus.ACTIVE, CampaignStatus.TO_CANCEL].includes(s) ===
          false,
      ),
    )(
      'should not process campaign when status is "%s"',
      async (campaignStatus) => {
        campaign.status = campaignStatus;

        await campaignsService.recordCampaignProgress(campaign);

        expect(spyOnRetrieveCampaignIntermediateResults).toHaveBeenCalledTimes(
          0,
        );
        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
        expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
        expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(0);
      },
    );

    it.each([
      EscrowStatus[EscrowStatus.Cancelled],
      EscrowStatus[EscrowStatus.Complete],
    ])(
      'should not process campaign when escrow status is "%s"',
      async (escrowStatus) => {
        mockedGetEscrowStatus
          .mockReset()
          .mockResolvedValueOnce(
            EscrowStatus[escrowStatus as unknown as EscrowStatus],
          );

        await campaignsService.recordCampaignProgress(campaign);

        expect(spyOnRetrieveCampaignIntermediateResults).toHaveBeenCalledTimes(
          0,
        );
        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
        expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
        expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(0);
      },
    );

    it('should not process campaign if it not started yet', async () => {
      const now = Date.now();
      campaign.startDate = new Date(now + 1);

      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(campaign);

      jest.useRealTimers();

      expect(spyOnRetrieveCampaignIntermediateResults).toHaveBeenCalledTimes(0);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(0);
    });

    it('should not check progress if less than a day from campaign start and it not ended', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const now = Date.now();
      campaign.startDate = dayjs(now)
        .subtract(1, 'day')
        .add(1, 'millisecond')
        .toDate();

      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(campaign);

      jest.useRealTimers();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
    });

    it('should use correct period dates for campaign with < 1d duration when no intermediate results', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      campaign.endDate = new Date(Date.now() - 1);
      campaign.startDate = dayjs(campaign.endDate)
        .subtract(faker.number.int({ min: 1, max: 23 }), 'hours')
        .toDate();

      await campaignsService.recordCampaignProgress(campaign);

      const expectedStartDate = new Date(campaign.startDate.valueOf());
      const expectedEndDate = campaign.endDate;

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should use correct period dates for campaign with > 1d duration when no intermediate results', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      await campaignsService.recordCampaignProgress(campaign);

      const expectedStartDate = new Date(campaign.startDate.valueOf());
      const expectedEndDate = dayjs(expectedStartDate).add(1, 'day').toDate();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should not check progress if less than a day from last results for ongoing campaign', async () => {
      const now = Date.now();
      const oneDayAgo = dayjs(now).subtract(1, 'day').toDate();
      const intermediateResultsData = generateIntermediateResultsData({
        results: [
          generateIntermediateResult({
            // add one ms to imitate "almost one day ago"
            endDate: new Date(oneDayAgo.valueOf() + 1),
          }),
        ],
      });
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(campaign);

      jest.useRealTimers();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
    });

    it('should use start date from last intermediate results when more than a day from last results but campaign not ended', async () => {
      const lastResultsEndDate = dayjs(campaign.startDate)
        .add(1, 'day')
        .toDate();

      const intermediateResultsData = generateIntermediateResultsData({
        results: [generateIntermediateResult({ endDate: lastResultsEndDate })],
      });
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedStartDate = new Date(lastResultsEndDate.valueOf() + 1);
      const expectedEndDate = dayjs(expectedStartDate).add(1, 'day').toDate();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should use start date from last intermediate results if less than a day from last results but campaign ended', async () => {
      const now = Date.now();
      campaign.endDate = new Date(now - 1);
      const lastResultsEndDate = dayjs().subtract(42, 'minutes').toDate();

      const intermediateResultsData = generateIntermediateResultsData({
        results: [
          generateIntermediateResult({
            endDate: lastResultsEndDate,
          }),
        ],
      });
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(campaign);

      jest.useRealTimers();

      const expectedStartDate = new Date(lastResultsEndDate.valueOf() + 1);
      const expectedEndDate = campaign.endDate;

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should use campaign end date if cancellation requested after campaign end date', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        new Date(campaign.endDate.valueOf() + 1),
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        campaign.startDate,
        campaign.endDate,
      );
    });

    it('should use cancellation request date if cancellation requested before campaign end date', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      const cancellationRequestedAt = new Date(campaign.endDate.valueOf() - 1);
      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        cancellationRequestedAt,
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        campaign.startDate,
        cancellationRequestedAt,
      );
    });

    it('should record campaign progress when no results yet', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        {
          chain_id: campaign.chainId,
          address: campaign.address,
          exchange: campaign.exchangeName,
          symbol: campaign.symbol,
          results: [
            {
              from: campaignProgress.from,
              to: campaignProgress.to,
              reserved_funds: '0',
              participants_outcomes_batches: [],
              ...campaignProgress.meta,
            },
          ],
        },
        0n,
      );
    });

    it('should record campaign progress to existing results', async () => {
      const intermediateResultsData = generateIntermediateResultsData({
        results: [generateIntermediateResult()],
      });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      const newCampaignProgress = generateCampaignProgress(campaign);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        newCampaignProgress,
      );

      const expectedNewIntermediateResultsData = {
        ...intermediateResultsData,
        results: [
          ...intermediateResultsData.results,
          {
            from: newCampaignProgress.from,
            to: newCampaignProgress.to,
            reserved_funds: '0',
            participants_outcomes_batches: [],
            ...newCampaignProgress.meta,
          },
        ],
      };

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expectedNewIntermediateResultsData,
        0n,
      );
    });

    it('should record correctly calculated reserved funds for MARKET_MAKING campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.MARKET_MAKING);
      const dailyVolumeTarget = (
        campaign.details as MarketMakingCampaignDetails
      ).dailyVolumeTarget;

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const totalVolume = faker.number.float({
        min: 0.1,
        max: dailyVolumeTarget * 2,
      });

      const campaignProgress = generateCampaignProgress(campaign);
      (campaignProgress.meta as MarketMakingMeta).total_volume = totalVolume;
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = campaignsService.calculateRewardPool({
        baseRewardPool: campaignsService.calculateDailyReward(campaign),
        maxRewardPoolRatio: 1,
        progressValue: totalVolume,
        progressValueTarget: dailyVolumeTarget,
        fundTokenDecimals: campaign.fundTokenDecimals,
      });

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            {
              from: campaignProgress.from,
              to: campaignProgress.to,
              total_volume: totalVolume,
              reserved_funds: expectedRewardPool,
              participants_outcomes_batches: [],
            },
          ],
        }),
        ethers.parseUnits(
          expectedRewardPool.toString(),
          campaign.fundTokenDecimals,
        ),
      );
    });

    it('should record correctly calculated reserved funds for HOLDING campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.HOLDING);
      const dailyBalanceTarget = (campaign.details as HoldingCampaignDetails)
        .dailyBalanceTarget;

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const totalBalance = faker.number.float({
        min: 0.1,
        max: dailyBalanceTarget * 2,
      });

      const campaignProgress = generateCampaignProgress(campaign);
      (campaignProgress.meta as HoldingMeta).total_balance = totalBalance;
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = campaignsService.calculateRewardPool({
        baseRewardPool: campaignsService.calculateDailyReward(campaign),
        maxRewardPoolRatio: 1,
        progressValue: totalBalance,
        progressValueTarget: dailyBalanceTarget,
        fundTokenDecimals: campaign.fundTokenDecimals,
      });

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            {
              from: campaignProgress.from,
              to: campaignProgress.to,
              total_balance: totalBalance,
              reserved_funds: expectedRewardPool,
              participants_outcomes_batches: [],
            },
          ],
        }),
        ethers.parseUnits(
          expectedRewardPool.toString(),
          campaign.fundTokenDecimals,
        ),
      );
    });

    it('should record correctly calculated reserved funds for THRESHOLD campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.THRESHOLD);
      const minimumBalanceTarget = (
        campaign.details as ThresholdCampaignDetails
      ).minimumBalanceTarget;

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const totalBalance = faker.number.float({
        min: 0.1,
        max: minimumBalanceTarget * 2,
      });

      const totalScore = totalBalance >= minimumBalanceTarget ? 1 : 0;

      const campaignProgress = generateCampaignProgress(campaign);
      (campaignProgress.meta as ThresholdMeta).total_balance = totalBalance;
      (campaignProgress.meta as ThresholdMeta).total_score = totalScore;
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = campaignsService.calculateRewardPool({
        baseRewardPool: campaignsService.calculateDailyReward(campaign),
        maxRewardPoolRatio: 1,
        progressValue: totalScore,
        progressValueTarget: 1,
        fundTokenDecimals: campaign.fundTokenDecimals,
      });

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            {
              from: campaignProgress.from,
              to: campaignProgress.to,
              total_balance: totalBalance,
              total_score: totalScore,
              reserved_funds: expectedRewardPool,
              participants_outcomes_batches: [],
            },
          ],
        }),
        ethers.parseUnits(
          expectedRewardPool.toString(),
          campaign.fundTokenDecimals,
        ),
      );
    });

    it('should record participant results in batches', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const participantOutcomes = [
        generateParticipantOutcome(),
        generateParticipantOutcome(),
        generateParticipantOutcome(),
      ];

      const campaignProgress = generateCampaignProgress(campaign);
      campaignProgress.participants_outcomes = participantOutcomes;
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);

      const intermediateResultsData = spyOnRecordCampaignIntermediateResults
        .mock.calls[0][0] as IntermediateResultsData;

      const recordedIntermediateResult = intermediateResultsData.results[0];

      const firstBatch =
        recordedIntermediateResult.participants_outcomes_batches[0];

      expect(isUuidV4(firstBatch.id)).toBe(true);
      expect(firstBatch.results.length).toBe(2);
      expect(firstBatch.results[0]).toEqual(participantOutcomes[0]);
      expect(firstBatch.results[1]).toEqual(participantOutcomes[1]);

      const secondBatch =
        recordedIntermediateResult.participants_outcomes_batches[1];
      expect(isUuidV4(secondBatch.id)).toBe(true);
      expect(secondBatch.results.length).toBe(1);
      expect(secondBatch.results[0]).toEqual(participantOutcomes[2]);
    });

    it('should not move campaign to "pending_completion" if reached its end date but not all results calculated', async () => {
      const currentDate = new Date();
      campaign.endDate = new Date(currentDate.valueOf() - 1);
      campaign.startDate = dayjs(campaign.endDate).subtract(3, 'day').toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateCampaignProgress(campaign),
      );
      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      jest.useFakeTimers({ now: currentDate });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        lastResultsAt: currentDate,
      });
    });

    it('should move campaign to "pending_completion" when reached its end date and all results calculated', async () => {
      const currentDate = new Date();
      campaign.endDate = new Date(currentDate.valueOf() - 1);
      campaign.startDate = dayjs(campaign.endDate).subtract(1, 'hour').toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateCampaignProgress(campaign),
      );
      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      jest.useFakeTimers({ now: currentDate });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'pending_completion',
        lastResultsAt: currentDate,
      });
    });

    it('should move campaign to "pending_completion" if recording period dates overlap', async () => {
      const escrowStatus = faker.helpers.arrayElement([
        EscrowStatus.Pending,
        EscrowStatus.Partial,
      ]);
      mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

      const currentDate = new Date();
      campaign.endDate = new Date(currentDate.valueOf() - 1);
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        generateIntermediateResultsData({
          results: [generateIntermediateResult({ endDate: campaign.endDate })],
        }),
      );

      jest.useFakeTimers({ now: currentDate });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Campaign progress period dates overlap',
        {
          startDate: currentDate,
          endDate: campaign.endDate,
          escrowStatus,
          escrowStatusString: EscrowStatus[escrowStatus],
        },
      );
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'pending_completion',
        lastResultsAt: currentDate,
      });

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
    });

    it('should move campaign to "pending_cancellation" when results recorded for cancellation request', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      const cancellationRequestedAt = dayjs(campaign.startDate)
        .add(1, 'minute')
        .toDate();
      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        cancellationRequestedAt,
      );

      const campaignProgress = generateCampaignProgress(campaign);
      campaignProgress.to = cancellationRequestedAt.toISOString();
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );
      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      const now = new Date();
      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'pending_cancellation',
        lastResultsAt: now,
      });
    });

    it('should move campaign to "pending_cancellation" when cancellation requested before campaign start', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        new Date(campaign.startDate.valueOf() - 1),
      );

      const now = new Date();
      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'pending_cancellation',
        lastResultsAt: now,
      });

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
    });

    it('should move campaign to "pending_cancellation" after internal status update failed and detected', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);

      const cancellationRequestedAt = dayjs(campaign.startDate)
        .add(5, 'minute')
        .toDate();
      const intermediateRestult = generateIntermediateResult({
        endDate: cancellationRequestedAt,
      });
      const intermediateResultsData = generateIntermediateResultsData({
        results: [intermediateRestult],
      });
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        cancellationRequestedAt,
      );

      const now = new Date();
      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'pending_cancellation',
        lastResultsAt: now,
      });

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
    });

    it('should record generated volume stat for MARKET_MAKING campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.MARKET_MAKING);

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledTimes(1);
      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledWith(campaign, {
        from: campaignProgress.from,
        to: campaignProgress.to,
        total_volume: 0,
        reserved_funds: '0',
        participants_outcomes_batches: [],
      });
    });

    it.each([CampaignType.HOLDING, CampaignType.THRESHOLD])(
      'should not record generated volume stat for [%#] campaign',
      async (campaignType) => {
        campaign = generateCampaignEntity(campaignType);

        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

        const campaignProgress = generateCampaignProgress(campaign);
        spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
          campaignProgress,
        );

        spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
          generateStoredResultsMeta(),
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(spyOnRecordGeneratedVolume).toHaveBeenCalledTimes(0);
      },
    );

    it('should log recording details once results recorded', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );
      const storedResultsMeta = generateStoredResultsMeta();
      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        storedResultsMeta,
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Campaign progress recorded', {
        from: campaignProgress.from,
        to: campaignProgress.to,
        reserved_funds: '0',
        resultsUrl: storedResultsMeta.url,
        ...campaignProgress.meta,
      });

      expect(logger.error).toHaveBeenCalledTimes(0);
    });
  });

  describe('recordCampaignsProgress', () => {
    let spyOnRecordCampaignProgress: jest.SpyInstance;

    beforeAll(() => {
      spyOnRecordCampaignProgress = jest.spyOn(
        campaignsService,
        'recordCampaignProgress',
      );
      spyOnRecordCampaignProgress.mockImplementation();
    });

    afterAll(() => {
      spyOnRecordCampaignProgress.mockRestore();
    });

    it('should trigger campaign progress recording for each campaign', async () => {
      const nCampaigns = faker.number.int({ min: 2, max: 5 });
      const campaigns = Array.from({ length: nCampaigns }, () =>
        generateCampaignEntity(),
      );
      mockCampaignsRepository.findForProgressRecording.mockResolvedValueOnce(
        campaigns,
      );

      await campaignsService.recordCampaignsProgress();

      expect(spyOnRecordCampaignProgress).toHaveBeenCalledTimes(nCampaigns);

      for (const campaign of campaigns) {
        expect(spyOnRecordCampaignProgress).toHaveBeenCalledWith(campaign);
      }
    });
  });

  describe('syncCampaignStatuses', () => {
    const nCampaigns = faker.number.int({ min: 2, max: 5 });

    it('should complete campaigns when detects completed escrow', async () => {
      const campaigns = Array.from({ length: nCampaigns }, () =>
        Object.assign(generateCampaignEntity(), {
          status: CampaignStatus.PENDING_COMPLETION,
        }),
      );
      mockCampaignsRepository.findForStatusSync.mockResolvedValueOnce(
        campaigns,
      );
      mockedEscrowUtils.getEscrow.mockResolvedValue({
        status: EscrowStatus[EscrowStatus.Complete],
      } as IEscrow);

      await campaignsService.syncCampaignStatuses();

      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(nCampaigns);

      for (const campaign of campaigns) {
        expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
          ...campaign,
          status: 'completed',
        });
        expect(logger.info).toHaveBeenCalledWith(
          'Marking campaign as completed',
          {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          },
        );
      }
    });

    it('should cancel campaigns when detects cancelled escrow', async () => {
      const campaigns = Array.from({ length: nCampaigns }, (_e, index) =>
        Object.assign(generateCampaignEntity(), {
          status:
            index % 2
              ? CampaignStatus.ACTIVE
              : CampaignStatus.PENDING_CANCELLATION,
        }),
      );
      mockCampaignsRepository.findForStatusSync.mockResolvedValueOnce(
        campaigns,
      );
      mockedEscrowUtils.getEscrow.mockResolvedValue({
        status: EscrowStatus[EscrowStatus.Cancelled],
      } as IEscrow);

      await campaignsService.syncCampaignStatuses();

      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(nCampaigns);

      for (const campaign of campaigns) {
        expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
          ...campaign,
          status: 'cancelled',
        });
        expect(logger.info).toHaveBeenCalledWith(
          'Marking campaign as cancelled',
          {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          },
        );
      }
    });

    it('should mark only "active" campaigns as to_cancel when detects to_cancel escrow', async () => {
      const campaigns = Object.values(CampaignStatus).map((campaignStatus) => {
        const campaign = generateCampaignEntity();
        campaign.status = campaignStatus;
        return campaign;
      });
      mockCampaignsRepository.findForStatusSync.mockResolvedValueOnce(
        campaigns,
      );
      const activeCampaignIndex = campaigns.findIndex(
        (c) => c.status === CampaignStatus.ACTIVE,
      );
      const activeCampaign = Object.assign({}, campaigns[activeCampaignIndex]);

      mockedEscrowUtils.getEscrow.mockResolvedValue({
        status: EscrowStatus[EscrowStatus.ToCancel],
      } as IEscrow);

      await campaignsService.syncCampaignStatuses();

      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...activeCampaign,
        status: 'to_cancel',
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Marking campaign as to_cancel',
        {
          campaignId: activeCampaign.id,
          chainId: activeCampaign.chainId,
          campaignAddress: activeCampaign.address,
        },
      );
    });

    it.each([
      EscrowStatus[EscrowStatus.Pending],
      EscrowStatus[EscrowStatus.Partial],
    ])(
      'should not change campaign status when detects "%s" escrow',
      async (escrowStatus) => {
        const campaigns = Array.from({ length: nCampaigns }, () =>
          Object.assign(generateCampaignEntity(), {
            status: CampaignStatus.ACTIVE,
          }),
        );
        mockCampaignsRepository.findForStatusSync.mockResolvedValueOnce(
          campaigns,
        );
        mockedEscrowUtils.getEscrow.mockResolvedValue({
          status: escrowStatus,
        } as IEscrow);

        await campaignsService.syncCampaignStatuses();

        expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(0);
      },
    );
  });

  describe('recordGeneratedVolume', () => {
    const campaign = generateCampaignEntity(CampaignType.MARKET_MAKING);
    const intermediateResult = generateIntermediateResult({
      meta: { total_volume: faker.number.float() },
    });

    it('should not record if quote token usd price is null', async () => {
      mockWeb3Service.getTokenPriceUsd.mockResolvedValueOnce(null);

      await campaignsService['recordGeneratedVolume'](
        campaign,
        intermediateResult,
      );

      expect(mockVolumeStatsRepository.upsert).toHaveBeenCalledTimes(0);
    });

    it('should not record nor fail if error while getting quote token price', async () => {
      mockWeb3Service.getTokenPriceUsd.mockRejectedValueOnce(new Error());

      await campaignsService['recordGeneratedVolume'](
        campaign,
        intermediateResult,
      );

      expect(mockVolumeStatsRepository.upsert).toHaveBeenCalledTimes(0);
    });

    it('should record with correct usd volume', async () => {
      const priceUsd = faker.number.float();
      mockWeb3Service.getTokenPriceUsd.mockResolvedValueOnce(priceUsd);

      const quoteToken = campaign.symbol.split('/')[1];

      await campaignsService['recordGeneratedVolume'](
        campaign,
        intermediateResult,
      );

      const resultTotalVolume = intermediateResult.total_volume as number;
      expect(mockVolumeStatsRepository.upsert).toHaveBeenCalledTimes(1);
      expect(mockVolumeStatsRepository.upsert).toHaveBeenCalledWith(
        {
          exchangeName: campaign.exchangeName,
          campaignAddress: campaign.address,
          periodStart: new Date(intermediateResult.from),
          periodEnd: new Date(intermediateResult.to),
          volume: resultTotalVolume.toString(),
          volumeUsd: (priceUsd * resultTotalVolume).toString(),
        },
        ['exchangeName', 'campaignAddress', 'periodStart'],
      );

      expect(mockWeb3Service.getTokenPriceUsd).toHaveBeenCalledTimes(1);
      expect(mockWeb3Service.getTokenPriceUsd).toHaveBeenCalledWith(quoteToken);
    });
  });

  describe('checkUserJoined', () => {
    let userId: string;
    let chainId: number;
    let campaign: CampaignEntity;

    beforeAll(() => {
      userId = faker.string.uuid();
      chainId = generateTestnetChainId();
      campaign = generateCampaignEntity();
    });

    it('should return false if campaign does not exist', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        null,
      );

      const result = await campaignsService.checkUserJoined(
        userId,
        chainId,
        // not checksummed address
        campaign.address.toLowerCase(),
      );

      expect(result).toBe(false);

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it('should return false if user not joined', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        false,
      );

      const result = await campaignsService.checkUserJoined(
        userId,
        chainId,
        campaign.address,
      );

      expect(result).toBe(false);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it('should return true if user joined', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        true,
      );

      const result = await campaignsService.checkUserJoined(
        userId,
        chainId,
        campaign.address,
      );

      expect(result).toBe(true);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });
  });

  describe('getActiveTimeframe', () => {
    const mockedNow = new Date();

    let campaign: CampaignEntity;
    let spyOnGetCancellationRequestDate: jest.SpyInstance;

    beforeAll(() => {
      jest.useFakeTimers({ now: mockedNow });

      spyOnGetCancellationRequestDate = jest.spyOn(
        escrowUtils,
        'getCancellationRequestDate',
      );
      spyOnGetCancellationRequestDate.mockImplementation();
    });

    afterAll(() => {
      jest.useRealTimers();

      spyOnGetCancellationRequestDate.mockRestore();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();
    });

    it('should return null if campaign not started', async () => {
      campaign.startDate = new Date(mockedNow.valueOf() + 1);

      const result = await campaignsService.getActiveTimeframe(campaign);

      expect(result).toBeNull();
    });

    it.each([
      {
        status: CampaignStatus.CANCELLED,
      },
      {
        status: CampaignStatus.COMPLETED,
      },
      {
        status: CampaignStatus.PENDING_CANCELLATION,
      },
      {
        endDate: new Date(mockedNow.valueOf() - 1),
      },
    ])(
      'should return null if campaign finisihed [%#]',
      async (campaignOverrides) => {
        Object.assign(campaign, campaignOverrides);

        const result = await campaignsService.getActiveTimeframe(campaign);

        expect(result).toBeNull();
      },
    );

    it('should return correct timeframe for active campaign', async () => {
      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const expectedTimeframeStart = dayjs(campaign.startDate)
        .add(campaignDaysPassed, 'days')
        .add(1, 'millisecond')
        .toDate();

      const result = await campaignsService.getActiveTimeframe(campaign);

      expect(result).toEqual({
        start: expectedTimeframeStart,
        end: mockedNow,
      });
    });

    it('should return correct timeframe when cancellation requested within that', async () => {
      campaign.status = CampaignStatus.TO_CANCEL;

      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const expectedTimeframeStart = dayjs(campaign.startDate)
        .add(campaignDaysPassed, 'days')
        .add(1, 'millisecond')
        .toDate();

      const cancellationRequestedAt = dayjs(expectedTimeframeStart)
        .add(1, 'minute')
        .toDate();
      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        cancellationRequestedAt,
      );

      const result = await campaignsService.getActiveTimeframe(campaign);

      expect(result).toEqual({
        start: expectedTimeframeStart,
        end: cancellationRequestedAt,
      });
    });

    it('should return null when cancellation requested outside active timeframe', async () => {
      campaign.status = CampaignStatus.TO_CANCEL;

      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const cancellationRequestedAt = dayjs(campaign.startDate)
        .subtract(1, 'millisecond')
        .toDate();
      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        cancellationRequestedAt,
      );

      const result = await campaignsService.getActiveTimeframe(campaign);

      expect(result).toBeNull();
    });
  });

  describe('refreshInterimProgressCache', () => {
    const mockInterimProgressCache = new Map();
    let replacedInterimProgressCacheRef: jest.ReplaceProperty<'campaignsInterimProgressCache'>;
    let spyOnCheckCampaignProgressForPeriod: jest.SpyInstance;
    let spyOnGetActiveTimeframe: jest.SpyInstance;

    beforeAll(() => {
      replacedInterimProgressCacheRef = jest.replaceProperty(
        campaignsService as any,
        'campaignsInterimProgressCache',
        mockInterimProgressCache,
      );

      spyOnCheckCampaignProgressForPeriod = jest.spyOn(
        campaignsService,
        'checkCampaignProgressForPeriod',
      );
      spyOnCheckCampaignProgressForPeriod.mockImplementation();

      spyOnGetActiveTimeframe = jest.spyOn(
        campaignsService,
        'getActiveTimeframe',
      );
      spyOnGetActiveTimeframe.mockImplementation();
    });

    afterAll(() => {
      replacedInterimProgressCacheRef.restore();

      spyOnCheckCampaignProgressForPeriod.mockRestore();
      spyOnGetActiveTimeframe.mockRestore();
    });

    beforeEach(() => {
      mockPgAdvisoryLock.withLock.mockImplementationOnce(async (_key, fn) => {
        await fn();
      });
      mockInterimProgressCache.clear();
    });

    it('should run with pessimistic lock', async () => {
      await campaignsService.refreshInterimProgressCache();

      expect(mockPgAdvisoryLock.withLock).toHaveBeenCalledTimes(1);
      expect(mockPgAdvisoryLock.withLock).toHaveBeenCalledWith(
        'refresh-interim-progress-cache',
        expect.any(Function),
      );
    });

    it('should refresh interim progress for each campaign', async () => {
      const nCampaigns = faker.number.int({ min: 2, max: 5 });
      const campaigns = Array.from({ length: nCampaigns }, () =>
        generateCampaignEntity(),
      );
      mockCampaignsRepository.findOngoingCampaigns.mockResolvedValueOnce(
        campaigns,
      );

      const mockedActiveTimeframe = {
        start: faker.date.recent(),
        end: faker.date.soon(),
      };
      spyOnGetActiveTimeframe.mockResolvedValue(mockedActiveTimeframe);

      const campaignsProgressMap: Map<
        string,
        CampaignProgress<CampaignProgressMeta>
      > = new Map();
      for (const campaign of campaigns) {
        const mockedProgress = generateCampaignProgress(campaign);
        mockedProgress.from = mockedActiveTimeframe.start.toISOString();
        mockedProgress.to = mockedActiveTimeframe.end.toISOString();

        campaignsProgressMap.set(campaign.id, mockedProgress);
      }
      spyOnCheckCampaignProgressForPeriod.mockImplementation(
        (campaign: CampaignEntity) => {
          return campaignsProgressMap.get(campaign.id);
        },
      );

      await campaignsService.refreshInterimProgressCache();

      expect(spyOnGetActiveTimeframe).toHaveBeenCalledTimes(nCampaigns);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(
        nCampaigns,
      );

      for (const campaign of campaigns) {
        expect(spyOnGetActiveTimeframe).toHaveBeenCalledWith(campaign);
        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
          campaign,
          mockedActiveTimeframe.start,
          mockedActiveTimeframe.end,
        );
        expect(mockInterimProgressCache.get(campaign.id)).toEqual(
          campaignsProgressMap.get(campaign.id),
        );
      }
    });

    it('should skip campaign for refresh if ends soon', async () => {
      const campaign = generateCampaignEntity();
      campaign.endDate = dayjs().add(5, 'minute').toDate();
      mockCampaignsRepository.findOngoingCampaigns.mockResolvedValueOnce([
        campaign,
      ]);

      await campaignsService.refreshInterimProgressCache();

      expect(spyOnGetActiveTimeframe).toHaveBeenCalledTimes(0);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(mockInterimProgressCache.size).toBe(0);
    });

    it('should skip campaign for refresh if no active timeframe', async () => {
      const campaign = generateCampaignEntity();
      mockCampaignsRepository.findOngoingCampaigns.mockResolvedValueOnce([
        campaign,
      ]);

      spyOnGetActiveTimeframe.mockResolvedValueOnce(null);

      await campaignsService.refreshInterimProgressCache();

      expect(spyOnGetActiveTimeframe).toHaveBeenCalledTimes(1);
      expect(spyOnGetActiveTimeframe).toHaveBeenCalledWith(campaign);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(mockInterimProgressCache.size).toBe(0);
    });

    it('should handle error for campaign and process others', async () => {
      const okCampaign = generateCampaignEntity();
      const errorCampaign = generateCampaignEntity();
      mockCampaignsRepository.findOngoingCampaigns.mockResolvedValueOnce([
        okCampaign,
        errorCampaign,
      ]);
      spyOnGetActiveTimeframe.mockResolvedValue({
        start: faker.date.recent(),
        end: faker.date.soon(),
      });
      const okCampaignProgress = generateCampaignProgress(okCampaign);
      const syntheticError = new Error(faker.lorem.sentence());
      spyOnCheckCampaignProgressForPeriod.mockImplementation(
        (campaign: CampaignEntity) => {
          if (campaign.id === okCampaign.id) {
            return okCampaignProgress;
          }

          throw syntheticError;
        },
      );

      await campaignsService.refreshInterimProgressCache();

      expect(spyOnGetActiveTimeframe).toHaveBeenCalledTimes(2);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(2);

      expect(mockInterimProgressCache.size).toBe(1);
      expect(mockInterimProgressCache.get(okCampaign.id)).toBeDefined();
      expect(mockInterimProgressCache.get(errorCampaign.id)).toBeUndefined();

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get interim progress for campaign',
        {
          error: syntheticError,
        },
      );
    });
  });

  describe('getUserProgress', () => {
    const mockInterimProgressCache = new Map();
    let replacedInterimProgressCacheRef: jest.ReplaceProperty<'campaignsInterimProgressCache'>;
    let spyOnGetActiveTimeframe: jest.SpyInstance;

    let userId: string;
    let evmAddress: string;
    let chainId: number;
    let campaign: CampaignEntity;

    beforeAll(() => {
      userId = faker.string.uuid();
      evmAddress = faker.finance.ethereumAddress();
      chainId = generateTestnetChainId();

      replacedInterimProgressCacheRef = jest.replaceProperty(
        campaignsService as any,
        'campaignsInterimProgressCache',
        mockInterimProgressCache,
      );

      spyOnGetActiveTimeframe = jest.spyOn(
        campaignsService,
        'getActiveTimeframe',
      );
      spyOnGetActiveTimeframe.mockImplementation();
    });

    afterAll(() => {
      replacedInterimProgressCacheRef.restore();

      spyOnGetActiveTimeframe.mockRestore();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();

      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );

      mockInterimProgressCache.clear();
    });

    it('should throw if campaign not found', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress
        .mockReset()
        .mockResolvedValueOnce(null);

      let thrownError;
      try {
        await campaignsService.getUserProgress(
          userId,
          evmAddress,
          chainId,
          campaign.address,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(CampaignNotFoundError);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaign.address);

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it('should throw if campaign not started yet', async () => {
      jest.useFakeTimers({
        now: dayjs(campaign.startDate).subtract(1, 'millisecond').toDate(),
      });

      let thrownError;
      try {
        await campaignsService.getUserProgress(
          userId,
          evmAddress,
          chainId,
          campaign.address,
        );
      } catch (error) {
        thrownError = error;
      }

      jest.useRealTimers();

      expect(thrownError).toBeInstanceOf(CampaignNotStartedError);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaign.address);

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it('should throw if campaign already finished', async () => {
      jest.useFakeTimers({
        now: new Date(campaign.endDate.valueOf() + 1),
      });

      let thrownError;
      try {
        await campaignsService.getUserProgress(
          userId,
          evmAddress,
          chainId,
          campaign.address,
        );
      } catch (error) {
        thrownError = error;
      }

      jest.useRealTimers();

      expect(thrownError).toBeInstanceOf(CampaignAlreadyFinishedError);
      expect(thrownError.chainId).toBe(chainId);
      expect(thrownError.address).toBe(campaign.address);

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it.each([
      CampaignStatus.CANCELLED,
      CampaignStatus.PENDING_CANCELLATION,
      CampaignStatus.COMPLETED,
    ])(
      'should throw if campaign status is not eligible for progress check: "%s"',
      async (campaignStatus) => {
        campaign.status = campaignStatus;

        let thrownError;
        try {
          await campaignsService.getUserProgress(
            userId,
            evmAddress,
            chainId,
            campaign.address,
          );
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(CampaignAlreadyFinishedError);
        expect(thrownError.chainId).toBe(chainId);
        expect(thrownError.address).toBe(campaign.address);

        expect(
          mockCampaignsRepository.findOneByChainIdAndAddress,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockCampaignsRepository.findOneByChainIdAndAddress,
        ).toHaveBeenCalledWith(chainId, campaign.address);

        expect(
          mockUserCampaignsRepository.checkUserJoinedCampaign,
        ).toHaveBeenCalledTimes(0);
      },
    );

    it('should throw if user not joined', async () => {
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        false,
      );

      let thrownError;
      try {
        await campaignsService.getUserProgress(
          userId,
          evmAddress,
          chainId,
          campaign.address,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(UserIsNotParticipatingError);

      expect(mockExchangeApiKeysService.retrieve).toHaveBeenCalledTimes(0);
    });

    it("should throw if can't get active timeframe", async () => {
      spyOnGetActiveTimeframe.mockReturnValueOnce(null);

      let thrownError;
      try {
        await campaignsService.getUserProgress(
          userId,
          evmAddress,
          chainId,
          campaign.address,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(InvalidCampaign);
      expect(thrownError.chainId).toBe(campaign.chainId);
      expect(thrownError.address).toBe(campaign.address);
      expect(thrownError.details).toBe("Couldn't get active timeframe");

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);
    });

    it('should return campaign progress for participant from cache if same timeframe', async () => {
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        true,
      );

      const participantMetaProp = faker.lorem.word();
      const participantMetaValue = faker.number.float();
      const participantOutcome = generateParticipantOutcome({
        address: evmAddress,
        [participantMetaProp]: participantMetaValue,
      });

      const mockedActiveTimeframe = {
        start: faker.date.recent(),
        end: faker.date.recent(),
      };
      spyOnGetActiveTimeframe.mockResolvedValueOnce(mockedActiveTimeframe);

      const campaignProgress: CampaignProgress<Record<string, unknown>> = {
        from: mockedActiveTimeframe.start.toISOString(),
        to: mockedActiveTimeframe.end.toISOString(),
        participants_outcomes: [
          generateParticipantOutcome(),
          participantOutcome,
          generateParticipantOutcome(),
        ],
        meta: {
          anything: faker.number.float(),
        },
      };
      mockInterimProgressCache.set(campaign.id, campaignProgress);

      const progress = await campaignsService.getUserProgress(
        userId,
        evmAddress,
        chainId,
        campaign.address,
      );

      expect(progress).toEqual({
        from: campaignProgress.from,
        to: campaignProgress.to,
        myScore: participantOutcome.score,
        myMeta: {
          [participantMetaProp]: participantMetaValue,
        },
        totalMeta: campaignProgress.meta,
      });
    });

    it('should return null if no value for campaign in cache', async () => {
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        true,
      );

      const mockedActiveTimeframe = {
        start: faker.date.recent(),
        end: faker.date.soon(),
      };
      spyOnGetActiveTimeframe.mockResolvedValueOnce(mockedActiveTimeframe);

      const progress = await campaignsService.getUserProgress(
        userId,
        evmAddress,
        chainId,
        campaign.address,
      );

      expect(progress).toBeNull();
    });

    it('should return null if value in cache is for previous timeframe', async () => {
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        true,
      );

      const mockedActiveTimeframe = {
        start: faker.date.recent(),
        end: faker.date.soon(),
      };
      spyOnGetActiveTimeframe.mockResolvedValueOnce(mockedActiveTimeframe);

      const campaignProgress: CampaignProgress<Record<string, unknown>> =
        generateCampaignProgress(campaign);
      campaignProgress.to = new Date(
        mockedActiveTimeframe.start.valueOf() - 1,
      ).toISOString();
      campaignProgress.from = faker.date
        .recent({
          refDate: campaignProgress.to,
        })
        .toISOString();
      mockInterimProgressCache.set(campaign.id, campaignProgress);

      const progress = await campaignsService.getUserProgress(
        userId,
        evmAddress,
        chainId,
        campaign.address,
      );

      expect(progress).toBeNull();
    });
  });

  describe('calculateDailyReward', () => {
    it('should correctly calculate reward when duration is integer number of days', () => {
      const duration = faker.number.int({ min: 1, max: 15 });
      const campaign = generateCampaignEntity();
      campaign.endDate = dayjs(campaign.startDate)
        .add(duration, 'days')
        .toDate();

      const dailyReward = campaignsService.calculateDailyReward(campaign);

      const expectedDailyReward = new Decimal(campaign.fundAmount)
        .div(duration)
        .toFixed(campaign.fundTokenDecimals, Decimal.ROUND_DOWN);
      expect(dailyReward).toBe(expectedDailyReward);
    });

    it('should correctly calculate reward when duration is not integer number of days', () => {
      /**
       * E.g. if duration is 5 days and 2 hours -
       * then there are 6 "day intervals" to distribute reward
       */

      const duration = faker.number.int({ min: 2, max: 15 });
      const campaign = generateCampaignEntity();
      campaign.endDate = dayjs(campaign.startDate)
        .add(duration - 1, 'days')
        .add(1, 'minute')
        .toDate();

      const dailyReward = campaignsService.calculateDailyReward(campaign);

      const expectedDailyReward = new Decimal(campaign.fundAmount)
        .div(duration)
        .toFixed(campaign.fundTokenDecimals, Decimal.ROUND_DOWN);
      expect(dailyReward).toBe(expectedDailyReward);
    });

    it('should correctly truncate reward value', () => {
      const duration = 6;
      const campaign = generateCampaignEntity();
      campaign.fundAmount = '10';
      campaign.fundTokenDecimals = 18;
      campaign.endDate = dayjs(campaign.startDate)
        .add(duration, 'days')
        .toDate();

      const dailyReward = campaignsService.calculateDailyReward(campaign);

      const expectedDailyReward = new Decimal(campaign.fundAmount)
        .div(duration)
        .toFixed(campaign.fundTokenDecimals, Decimal.ROUND_DOWN);
      expect(dailyReward).toBe(expectedDailyReward);
    });
  });

  describe('calculateRewardPool', () => {
    const TEST_TOKEN_DECIMALS = faker.helpers.arrayElement([6, 18]);

    let baseRewardPool: string;
    let progressValueTarget: number;

    beforeEach(() => {
      baseRewardPool = faker.number.float({ min: 10, max: 100 }).toString();
      progressValueTarget = faker.number.float({ min: 1, max: 1000 });
    });

    it('should return 0 reward pool when generated volume is 0', () => {
      const rewardPool = campaignsService.calculateRewardPool({
        baseRewardPool,
        maxRewardPoolRatio: 1,
        progressValueTarget,
        progressValue: 0,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
      });

      expect(rewardPool).toBe('0');
    });

    it('should correctly calculate reward pool when generated volume is lower than target but not 0', () => {
      progressValueTarget = 42;
      const progressValue = faker.number.float({
        min: 1,
        max: progressValueTarget,
      });

      const rewardPool = campaignsService.calculateRewardPool({
        baseRewardPool,
        maxRewardPoolRatio: 1,
        progressValueTarget,
        progressValue,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
      });

      const expectedRewardRatio = progressValue / progressValueTarget;
      const expectedRewardPool = new Decimal(baseRewardPool)
        .mul(expectedRewardRatio)
        .toFixed(TEST_TOKEN_DECIMALS, Decimal.ROUND_DOWN);
      expect(rewardPool).toBe(expectedRewardPool);
    });

    it('should correctly calculate reward pool when generated volume meets target', () => {
      const progressValue = faker.number.float({
        min: progressValueTarget,
        max: progressValueTarget * 10,
      });

      const rewardPool = campaignsService.calculateRewardPool({
        baseRewardPool,
        maxRewardPoolRatio: 1,
        progressValueTarget,
        progressValue,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
      });

      const expectedRewardPool = new Decimal(baseRewardPool).toFixed(
        TEST_TOKEN_DECIMALS,
        Decimal.ROUND_DOWN,
      );
      expect(rewardPool).toBe(expectedRewardPool);
    });

    it('should respect maxRewardPoolRatio', () => {
      const maxRewardPoolRatio = faker.number.int({ min: 2, max: 5 });

      const progressValue = faker.number.float({
        min: progressValueTarget * (maxRewardPoolRatio + 1),
        max: progressValueTarget * (maxRewardPoolRatio + 2),
      });

      const rewardPool = campaignsService.calculateRewardPool({
        baseRewardPool,
        maxRewardPoolRatio,
        progressValueTarget,
        progressValue,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
      });

      const expectedRewardPool = new Decimal(baseRewardPool)
        .mul(maxRewardPoolRatio)
        .toFixed(TEST_TOKEN_DECIMALS, Decimal.ROUND_DOWN);
      expect(rewardPool).toBe(expectedRewardPool);
    });
  });

  describe('discoverNewCampaigns', () => {
    const originalSupportedChainIds = mockWeb3Service.supportedChainIds;
    const supportedChainId = faker.number.int();

    let spyOnRetrieveCampaignData: jest.SpyInstance;
    let spyOnCreateCampaign: jest.SpyInstance;

    beforeAll(() => {
      spyOnRetrieveCampaignData = jest.spyOn(
        campaignsService,
        'retrieveCampaignData' as any,
      );
      spyOnRetrieveCampaignData.mockImplementation();

      spyOnCreateCampaign = jest.spyOn(campaignsService, 'createCampaign');
      spyOnCreateCampaign.mockImplementation();
    });

    beforeEach(() => {
      (mockWeb3Service.supportedChainIds as any) = [supportedChainId];
    });

    afterAll(() => {
      (mockWeb3Service.supportedChainIds as any) = originalSupportedChainIds;

      spyOnRetrieveCampaignData.mockRestore();
      spyOnCreateCampaign.mockRestore();
    });

    it('should run discovery for each supported chain', async () => {
      (mockWeb3Service.supportedChainIds as any) = [
        faker.number.int(),
        faker.number.int(),
      ];

      await campaignsService.discoverNewCampaigns();

      expect(
        mockCampaignsRepository.findLatestCampaignForChain,
      ).toHaveBeenCalledTimes(mockWeb3Service.supportedChainIds.length);
      for (const chainId of mockWeb3Service.supportedChainIds) {
        expect(
          mockCampaignsRepository.findLatestCampaignForChain,
        ).toHaveBeenCalledWith(chainId);
      }
    });

    it('should use latest saved campaign for lookback', async () => {
      const campaign = generateCampaignEntity();
      mockCampaignsRepository.findLatestCampaignForChain.mockResolvedValueOnce(
        campaign,
      );
      const escrowTimestamp = faker.date.past().valueOf();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        createdAt: escrowTimestamp,
      } as IEscrow);

      await campaignsService.discoverNewCampaigns();

      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledTimes(1);
      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledWith({
        chainId: supportedChainId,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
        status: EscrowStatus.Pending,
        from: new Date(escrowTimestamp),
        orderDirection: OrderDirection.ASC,
        first: 10,
      });
    });

    it('should use 1d ago for lookback if no latest campaign', async () => {
      mockCampaignsRepository.findLatestCampaignForChain.mockResolvedValueOnce(
        null,
      );
      const now = new Date();

      const dayAgo = dayjs(now).subtract(1, 'day').toDate();

      jest.useFakeTimers({ now });

      await campaignsService.discoverNewCampaigns();

      jest.useRealTimers();

      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledTimes(1);
      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledWith({
        chainId: supportedChainId,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
        status: EscrowStatus.Pending,
        from: dayAgo,
        orderDirection: OrderDirection.ASC,
        first: 10,
      });
    });

    it('should not save discovered campaign if it already exists', async () => {
      mockCampaignsRepository.findLatestCampaignForChain.mockResolvedValueOnce(
        null,
      );
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(true);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
      } as IEscrow;
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([escrow]);

      await campaignsService.discoverNewCampaigns();

      expect(mockCampaignsRepository.checkCampaignExists).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCampaignsRepository.checkCampaignExists).toHaveBeenCalledWith(
        supportedChainId,
        campaignAddress,
      );

      expect(logger.debug).toHaveBeenCalledTimes(4);
      expect(logger.debug).toHaveBeenNthCalledWith(
        3,
        'Discovered campaign already exists; skip it',
        {
          chainId: supportedChainId,
          campaignAddress,
        },
      );
    });

    it('should save discovered campaign if not already exist', async () => {
      mockCampaignsRepository.findLatestCampaignForChain.mockResolvedValueOnce(
        null,
      );
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(false);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
      } as IEscrow;
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([escrow]);

      const campaignManifest = generateCampaignManifest();
      const escrowInfo = {
        fundAmount: faker.number.float(),
        fundTokenSymbol: faker.finance.currencyCode(),
      };
      spyOnRetrieveCampaignData.mockResolvedValueOnce({
        manifest: campaignManifest,
        escrowInfo,
      });
      const mockCampaign = { id: faker.string.uuid() };
      spyOnCreateCampaign.mockResolvedValueOnce(mockCampaign);

      await campaignsService.discoverNewCampaigns();

      expect(spyOnRetrieveCampaignData).toHaveBeenCalledTimes(1);
      expect(spyOnRetrieveCampaignData).toHaveBeenCalledWith(
        supportedChainId,
        campaignAddress,
      );

      expect(spyOnCreateCampaign).toHaveBeenCalledTimes(1);
      expect(spyOnCreateCampaign).toHaveBeenCalledWith(
        supportedChainId,
        campaignAddress,
        campaignManifest,
        escrowInfo,
      );

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Discovered and created new campaign',
        {
          chainId: supportedChainId,
          campaignAddress,
          campaignId: mockCampaign.id,
        },
      );
    });

    it('should not save and skip discovered campaign if invalid', async () => {
      mockCampaignsRepository.findLatestCampaignForChain.mockResolvedValueOnce(
        null,
      );
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(false);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
      } as IEscrow;
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([escrow]);

      const syntheticError = new InvalidCampaign(
        supportedChainId,
        campaignAddress,
        faker.lorem.sentence(),
      );
      spyOnRetrieveCampaignData.mockRejectedValueOnce(syntheticError);

      await campaignsService.discoverNewCampaigns();

      expect(spyOnRetrieveCampaignData).toHaveBeenCalledTimes(1);
      expect(spyOnRetrieveCampaignData).toHaveBeenCalledWith(
        supportedChainId,
        campaignAddress,
      );

      expect(spyOnCreateCampaign).toHaveBeenCalledTimes(0);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Discovered campaign is not valid; skip it',
        {
          chainId: supportedChainId,
          campaignAddress,
          error: syntheticError,
        },
      );

      expect(logger.error).toHaveBeenCalledTimes(0);
    });

    it('should rethrow and stop discovery if fails to retrieve some campaign', async () => {
      mockCampaignsRepository.findLatestCampaignForChain.mockResolvedValueOnce(
        null,
      );
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(false);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
      } as IEscrow;
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce([escrow]);

      const syntheticError = new Error(faker.lorem.sentence());
      spyOnRetrieveCampaignData.mockRejectedValueOnce(syntheticError);

      await campaignsService.discoverNewCampaigns();

      expect(spyOnRetrieveCampaignData).toHaveBeenCalledTimes(1);
      expect(spyOnRetrieveCampaignData).toHaveBeenCalledWith(
        supportedChainId,
        campaignAddress,
      );

      expect(spyOnCreateCampaign).toHaveBeenCalledTimes(0);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to save discovered campaign',
        {
          chainId: supportedChainId,
          campaignAddress,
          error: syntheticError,
        },
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error while discovering new campaigns for chain',
        {
          chainId: supportedChainId,
          error: new Error('Failed to save campaign'),
        },
      );
    });

    it('should process each discovered campaign', async () => {
      mockCampaignsRepository.findLatestCampaignForChain.mockResolvedValueOnce(
        null,
      );
      mockCampaignsRepository.checkCampaignExists.mockResolvedValue(true);

      const escrows = Array.from(
        { length: faker.number.int({ min: 2, max: 4 }) },
        () => ({
          address: faker.finance.ethereumAddress(),
        }),
      );
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce(escrows as IEscrow[]);

      await campaignsService.discoverNewCampaigns();

      expect(mockCampaignsRepository.checkCampaignExists).toHaveBeenCalledTimes(
        escrows.length,
      );
    });
  });
});
