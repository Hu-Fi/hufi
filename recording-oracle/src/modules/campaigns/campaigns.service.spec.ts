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
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import _ from 'lodash';

import * as decimalUtils from '@/common/utils/decimal';
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
  generateIntermediateResult,
  generateIntermediateResultsData,
  generateHoldingCampaignManifest,
  generateStoredResultsMeta,
  generateMarketMakingCampaignManifest,
  generateCampaignProgress,
  generateParticipantOutcome,
  generateCampaignManifest,
  MockCampaignProgressChecker,
  MockProgressCheckResult,
  generateCampaignParticipant,
} from './fixtures';
import * as manifestUtils from './manifest.utils';
import {
  HoldingProgressChecker,
  MarketMakingProgressChecker,
} from './progress-checking';
import { HoldingMeta } from './progress-checking/holding';
import { MarketMakingMeta } from './progress-checking/market-making';
import {
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  HoldingCampaignDetails,
  IntermediateResultsData,
  MarketMakingCampaignDetails,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(null as any);

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: '',
      } as any);

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
      } as any);

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
      expect(thrownError.details).toBe('Missing fund amount data');

      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );
    });

    it('should throw when subgraph is missing manifest url', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt().toString(),
        manifest: '',
      } as any);

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt().toString(),
        manifest: faker.internet.url(),
        recordingOracle: escrowRecordingOracle,
      } as any);

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

    it.each([EscrowStatus.Cancelled, EscrowStatus.Complete])(
      'should throw when escrow has invalid status [%#]',
      async (escrowStatus) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          token: faker.finance.ethereumAddress(),
          totalFundedAmount: faker.number.bigInt().toString(),
          manifest: faker.internet.url(),
          recordingOracle: mockWeb3ConfigService.operatorAddress,
        } as any);
        mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

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
          `Invalid status: ${EscrowStatus[escrowStatus]}`,
        );

        expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
          chainId,
          campaignAddress,
        );

        expect(mockedGetEscrowStatus).toHaveBeenCalledWith(campaignAddress);
      },
    );

    it('should log and throw when fails to download manifest', async () => {
      const manifestUrl = faker.internet.url();
      const manifestHash = faker.string.hexadecimal();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt().toString(),
        manifest: manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
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
      delete (manifest as any).symbol;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt().toString(),
        manifest,
        manifestHash: faker.string.hexadecimal(),
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt().toString(),
        manifest: manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateBaseCampaignManifest();
      mockedManifest.exchange = faker.lorem.word();
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt().toString(),
        manifest: manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
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
    ])(
      'should retrieve and return data (manifest url) [%#]',
      async (mockedManifest) => {
        const manifestUrl = faker.internet.url();
        const manifestHash = faker.string.hexadecimal();
        const totalFundedAmount = faker.number.bigInt().toString();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          token: faker.finance.ethereumAddress(),
          totalFundedAmount,
          manifest: manifestUrl,
          manifestHash,
          recordingOracle: mockWeb3ConfigService.operatorAddress,
        } as any);
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
    ])(
      'should retrieve and return data (manifest json) [%#]',
      async (mockedManifest) => {
        const totalFundedAmount = faker.number.bigInt().toString();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
          token: faker.finance.ethereumAddress(),
          totalFundedAmount,
          manifest: JSON.stringify(mockedManifest),
          recordingOracle: mockWeb3ConfigService.operatorAddress,
        } as any);
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

    it('should create hodling campaign with proper data', async () => {
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
  });

  describe('join', () => {
    let campaign: CampaignEntity;
    let userId: string;
    let chainId: number;

    beforeEach(() => {
      campaign = generateCampaignEntity();
      userId = faker.string.uuid();
      chainId = generateTestnetChainId();
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

    it('should throw when joining campaign that already finished', async () => {
      campaign.endDate = faker.date.past();
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        false,
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

      const mockGasPrice = faker.number.bigInt();
      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(mockGasPrice);

      const intermediateResultsData = generateIntermediateResultsData();
      const stringifiedResultsData = JSON.stringify(intermediateResultsData);

      const resultsHash = crypto
        .createHash('sha256')
        .update(stringifiedResultsData)
        .digest('hex');

      const recordingResult = await campaignsService[
        'recordCampaignIntermediateResults'
      ](intermediateResultsData);

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
    let campaign: CampaignEntity;

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
    });

    afterAll(() => {
      spyOnRetrieveCampaignIntermediateResults.mockRestore();
      spyOnCheckCampaignProgressForPeriod.mockRestore();
      spyOnRecordCampaignIntermediateResults.mockRestore();
      spyOnRecordGeneratedVolume.mockRestore();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();

      mockPgAdvisoryLock.withLock.mockImplementationOnce(async (_key, fn) => {
        await fn();
      });
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
        const syntheticError = new Error(faker.lorem.word());
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

        const syntheticError = new Error(faker.lorem.word());
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
          generateCampaignProgress(campaign.type),
        );

        const syntheticError = new Error(faker.lorem.word());
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

        const campaignProgress = generateCampaignProgress(campaign.type);
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
      Object.values(CampaignStatus).filter((s) => s !== CampaignStatus.ACTIVE),
    )('should not process campaign when status is "%s"', async (status) => {
      campaign.status = status;

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRetrieveCampaignIntermediateResults).toHaveBeenCalledTimes(0);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(0);
    });

    it('should use start date from campaign when no intermediate results yet', async () => {
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

    it('should evaluate start date from last intermediate results', async () => {
      const lastResultsEndDate = dayjs().subtract(2, 'days').toDate();

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

    it('should not check progress if less than a day from last results for ongoing campaign', async () => {
      jest.useFakeTimers({ now: new Date() });

      const oneDayAgo = dayjs().subtract(1, 'day').toDate();

      const intermediateResultsData = generateIntermediateResultsData({
        results: [
          generateIntermediateResult({
            endDate: dayjs(oneDayAgo).subtract(1, 'day').toDate(),
          }),
          generateIntermediateResult({
            // add one ms to imitate "almost one day ago"
            endDate: new Date(oneDayAgo.valueOf() + 1),
          }),
        ],
      });
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      await campaignsService.recordCampaignProgress(campaign);

      jest.useRealTimers();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
    });

    it('should evaluate start date from last intermediate results if less than a day from last results but campaign ended', async () => {
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
      campaign.endDate = dayjs().subtract(1, 'minutes').toDate();

      await campaignsService.recordCampaignProgress(campaign);

      const expectedStartDate = new Date(lastResultsEndDate.valueOf() + 1);
      const expectedEndDate = campaign.endDate;

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should use campaign end date if less than a day left to check', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

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

    it('should record campaign progress when no results yet', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign.type);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith({
        chain_id: campaign.chainId,
        address: campaign.address,
        exchange: campaign.exchangeName,
        symbol: campaign.symbol,
        results: [
          {
            from: campaignProgress.from,
            to: campaignProgress.to,
            reserved_funds: 0,
            participants_outcomes_batches: [],
            ...campaignProgress.meta,
          },
        ],
      });
    });

    it('should record campaign progress to existing results', async () => {
      const intermediateResultsData = generateIntermediateResultsData({
        results: [generateIntermediateResult()],
      });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      const newCampaignProgress = generateCampaignProgress(campaign.type);
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
            reserved_funds: 0,
            participants_outcomes_batches: [],
            ...newCampaignProgress.meta,
          },
        ],
      };

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expectedNewIntermediateResultsData,
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

      const campaignProgress = generateCampaignProgress(campaign.type);
      (campaignProgress.meta as MarketMakingMeta).total_volume = totalVolume;
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = campaignsService.calculateRewardPool({
        maxRewardPool: campaignsService.calculateDailyReward(campaign),
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

      const campaignProgress = generateCampaignProgress(campaign.type);
      (campaignProgress.meta as HoldingMeta).total_balance = totalBalance;
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = campaignsService.calculateRewardPool({
        maxRewardPool: campaignsService.calculateDailyReward(campaign),
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
      );
    });

    it('should record participant results in batches', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const participantOutcomes = [
        generateParticipantOutcome(),
        generateParticipantOutcome(),
        generateParticipantOutcome(),
      ];

      const campaignProgress = generateCampaignProgress(campaign.type);
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

    it('should not move campaign to "pending_completion" if not ended yet', async () => {
      const now = new Date();
      jest.useFakeTimers({ now });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateCampaignProgress(campaign.type),
      );
      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'active',
        lastResultsAt: now,
      });
    });

    it('should not move campaign to "pending_completion" if reached its end date but not all results calculated', async () => {
      const now = new Date();
      campaign.endDate = new Date(now.valueOf() - 1);

      const lastResultsEndDate = dayjs(campaign.endDate)
        .subtract(2, 'days')
        .toDate();

      campaign.startDate = dayjs(lastResultsEndDate)
        .subtract(1, 'day')
        .toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateCampaignProgress(campaign.type, lastResultsEndDate),
      );
      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        lastResultsAt: now,
      });
    });

    it('should move campaign to "pending_completion" when reached its end date and all results calculated', async () => {
      const now = new Date();
      campaign.endDate = new Date(now.valueOf() - 1);

      const lastResultsEndDate = dayjs(campaign.endDate)
        .subtract(1, 'day')
        .toDate();

      campaign.startDate = dayjs(lastResultsEndDate)
        .subtract(1, 'day')
        .toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        generateIntermediateResultsData({
          results: [
            generateIntermediateResult({ endDate: lastResultsEndDate }),
          ],
        }),
      );
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateCampaignProgress(campaign.type, campaign.endDate),
      );
      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      jest.useFakeTimers({ now });

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      jest.useRealTimers();

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'pending_completion',
        lastResultsAt: now,
      });
    });

    it('should move campaign to "pending_completion" campaign if recording period dates overlap', async () => {
      campaign.endDate = dayjs().subtract(1, 'day').toDate();

      campaign.startDate = dayjs(campaign.endDate).subtract(1, 'day').toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        generateIntermediateResultsData({
          results: [generateIntermediateResult({ endDate: campaign.endDate })],
        }),
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

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Campaign progress period dates overlap',
      );
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'pending_completion',
        lastResultsAt: now,
      });

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledTimes(0);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
    });

    it('should record generated volume stat for MARKET_MAKING campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.MARKET_MAKING);

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign.type);
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
        reserved_funds: 0,
        participants_outcomes_batches: [],
      });
    });

    it('should not record generated volume stat for HOLDING campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.HOLDING);

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign.type);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledTimes(0);
    });

    it('should log recording details once results recorded', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign.type);
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
        reserved_funds: 0,
        resultsUrl: storedResultsMeta.url,
        ...campaignProgress.meta,
      });

      expect(logger.error).toHaveBeenCalledTimes(0);
    });
  });

  describe('recordCampaignsProgress', () => {
    let spyOnRecordCampaignProgress: jest.SpyInstance;

    const mockedGetEscrowStatus = jest.fn();

    beforeAll(() => {
      spyOnRecordCampaignProgress = jest.spyOn(
        campaignsService,
        'recordCampaignProgress',
      );
      spyOnRecordCampaignProgress.mockImplementation();
    });

    beforeEach(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getStatus: mockedGetEscrowStatus,
      } as unknown as EscrowClient);
    });

    afterAll(() => {
      spyOnRecordCampaignProgress.mockRestore();
    });

    it('should trigger campaign progress recording for each campaign', async () => {
      mockedGetEscrowStatus.mockResolvedValue(EscrowStatus.Pending);

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

    it('should skip campaigns that cancelled on blockchain', async () => {
      mockedGetEscrowStatus.mockResolvedValue(EscrowStatus.Cancelled);

      const nCampaigns = 2;
      const campaigns = Array.from({ length: nCampaigns }, () =>
        generateCampaignEntity(),
      );
      mockCampaignsRepository.findForProgressRecording.mockResolvedValueOnce(
        campaigns,
      );

      await campaignsService.recordCampaignsProgress();

      expect(spyOnRecordCampaignProgress).toHaveBeenCalledTimes(0);
      expect(logger.warn).toHaveBeenCalledTimes(nCampaigns);

      for (const campaign of campaigns) {
        expect(logger.warn).toHaveBeenCalledWith(
          'Campaign cancelled, skipping progress recording',
          {
            campaignId: campaign.id,
            chainId: campaign.chainId,
            campaignAddress: campaign.address,
          },
        );
      }
    });
  });

  describe('trackCampaignsFinish', () => {
    const nCampaigns = faker.number.int({ min: 2, max: 5 });

    it('should finish campaigns when detects completed escrow', async () => {
      const campaigns = Array.from({ length: nCampaigns }, () =>
        Object.assign(generateCampaignEntity(), {
          status: CampaignStatus.PENDING_COMPLETION,
        }),
      );
      mockCampaignsRepository.findForFinishTracking.mockResolvedValueOnce(
        campaigns,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValue({
        status: EscrowStatus[EscrowStatus.Complete],
      } as any);

      await campaignsService.trackCampaignsFinish();

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

    it('should finish campaigns when detects cancelled escrow', async () => {
      const campaigns = Array.from({ length: nCampaigns }, () =>
        Object.assign(generateCampaignEntity(), {
          status: CampaignStatus.ACTIVE,
        }),
      );
      mockCampaignsRepository.findForFinishTracking.mockResolvedValueOnce(
        campaigns,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValue({
        status: EscrowStatus[EscrowStatus.Cancelled],
      } as any);

      await campaignsService.trackCampaignsFinish();

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

    it('should not finish campaigns when detects not finished escrow', async () => {
      const campaigns = Array.from({ length: nCampaigns }, () =>
        Object.assign(generateCampaignEntity(), {
          status: CampaignStatus.ACTIVE,
        }),
      );
      mockCampaignsRepository.findForFinishTracking.mockResolvedValueOnce(
        campaigns,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValue({
        status: EscrowStatus[EscrowStatus.Partial],
      } as any);

      await campaignsService.trackCampaignsFinish();

      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(0);
    });
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

  describe('getUserProgress', () => {
    const mockCampaignProgressChecker = new MockCampaignProgressChecker();

    let spyOnGetCampaignProgressChecker: jest.SpyInstance;
    let spyOnCheckCampaignProgressForPeriod: jest.SpyInstance;

    let userId: string;
    let evmAddress: string;
    let chainId: number;
    let campaign: CampaignEntity;

    beforeAll(() => {
      userId = faker.string.uuid();
      evmAddress = faker.finance.ethereumAddress();
      chainId = generateTestnetChainId();

      spyOnGetCampaignProgressChecker = jest.spyOn(
        campaignsService as any,
        'getCampaignProgressChecker',
      );

      spyOnCheckCampaignProgressForPeriod = jest.spyOn(
        campaignsService,
        'checkCampaignProgressForPeriod',
      );
      spyOnCheckCampaignProgressForPeriod.mockImplementation();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();

      spyOnGetCampaignProgressChecker.mockReturnValueOnce(
        mockCampaignProgressChecker,
      );
    });

    afterAll(() => {
      spyOnGetCampaignProgressChecker.mockRestore();
      spyOnCheckCampaignProgressForPeriod.mockRestore();
    });

    it('should throw if campaign not found', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        null,
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

      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
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
        now: dayjs(campaign.endDate).add(1, 'millisecond').toDate(),
      });

      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
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

    it('should throw if user not joined', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
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

    it('should return campaign progress for participant', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        true,
      );

      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const expectedTimeframeStart = dayjs(campaign.startDate)
        .add(campaignDaysPassed, 'days')
        .toDate();
      const expectedTimeframeIsoString = expectedTimeframeStart.toISOString();

      const now = new Date();
      const nowIsoString = now.toISOString();

      const participantMetaProp = faker.lorem.word();
      const participantMetaValue = faker.number.float();
      const participantOutcome = generateParticipantOutcome({
        address: evmAddress,
        [participantMetaProp]: participantMetaValue,
      });

      const campaignProgress: CampaignProgress<Record<string, unknown>> = {
        from: expectedTimeframeIsoString,
        to: nowIsoString,
        participants_outcomes: [
          generateParticipantOutcome(),
          participantOutcome,
          generateParticipantOutcome(),
        ],
        meta: {
          anything: faker.number.float(),
        },
      };

      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      jest.useFakeTimers({ now });

      const progress = await campaignsService.getUserProgress(
        userId,
        evmAddress,
        chainId,
        campaign.address,
      );

      jest.useRealTimers();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        expectedTimeframeStart,
        now,
      );
      expect(progress).toEqual({
        from: expectedTimeframeIsoString,
        to: nowIsoString,
        myScore: participantOutcome.score,
        myMeta: {
          [participantMetaProp]: participantMetaValue,
        },
        totalMeta: campaignProgress.meta,
      });
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

      const expectedDailyReward = decimalUtils.truncate(
        decimalUtils.div(Number(campaign.fundAmount), duration),
        campaign.fundTokenDecimals,
      );
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

      const expectedDailyReward = decimalUtils.truncate(
        decimalUtils.div(Number(campaign.fundAmount), duration),
        campaign.fundTokenDecimals,
      );
      expect(dailyReward).toBe(expectedDailyReward);
    });
  });

  describe('calculateRewardPool', () => {
    const TEST_TOKEN_DECIMALS = faker.helpers.arrayElement([6, 18]);

    let maxRewardPool: number;
    let progressValueTarget: number;

    beforeEach(() => {
      maxRewardPool = faker.number.int({ min: 10, max: 100 });
      progressValueTarget = faker.number.int({ min: 1, max: 1000 });
    });

    it('should return 0 reward pool when generated volume is 0', () => {
      const rewardPool = campaignsService.calculateRewardPool({
        maxRewardPool,
        progressValueTarget,
        progressValue: 0,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
      });

      expect(rewardPool).toBe(0);
    });

    it('should correctly calculate reward pool when generated volume is lower than target but not 0', () => {
      progressValueTarget = 42;
      const progressValue = faker.number.float({
        min: 1,
        max: progressValueTarget,
      });

      const rewardPool = campaignsService.calculateRewardPool({
        maxRewardPool,
        progressValueTarget,
        progressValue,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
      });

      const expectedRewardRatio = progressValue / progressValueTarget;
      const expectedRewardPool = decimalUtils.truncate(
        expectedRewardRatio * maxRewardPool,
        TEST_TOKEN_DECIMALS,
      );
      expect(rewardPool).toBe(expectedRewardPool);
    });

    it('should correctly calculate reward pool when generated volume meets target', () => {
      const progressValue = faker.number.float({
        min: progressValueTarget,
        max: progressValueTarget * 10,
      });

      const rewardPool = campaignsService.calculateRewardPool({
        maxRewardPool,
        progressValueTarget,
        progressValue,
        fundTokenDecimals: TEST_TOKEN_DECIMALS,
      });

      expect(rewardPool).toBe(maxRewardPool);
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
      const escrowTimestamp = Math.round(faker.date.past().valueOf() / 1000);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        createdAt: escrowTimestamp.toString(),
      } as IEscrow);

      await campaignsService.discoverNewCampaigns();

      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledTimes(1);
      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledWith({
        chainId: supportedChainId,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
        status: EscrowStatus.Pending,
        from: new Date(escrowTimestamp * 1000),
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
