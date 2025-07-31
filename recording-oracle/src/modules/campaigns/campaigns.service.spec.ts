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
import { EscrowClient, EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import dayjs from 'dayjs';
import { ethers } from 'ethers';

import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { isUuidV4 } from '@/common/validators';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { ExchangeApiKeysService } from '@/modules/exchange-api-keys';
import { StorageService } from '@/modules/storage';
import { generateUserEntity } from '@/modules/users/fixtures';
import { Web3Service } from '@/modules/web3';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '@/modules/web3/fixtures';

import { CampaignEntity } from './campaign.entity';
import {
  CampaignAlreadyFinishedError,
  CampaignNotFoundError,
  InvalidCampaign,
} from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import {
  generateCampaignManifest,
  generateIntermediateResult,
  generateIntermediateResultsData,
  generateProgressCheckerSetup,
} from './fixtures';
import { generateCampaignEntity } from './fixtures';
import * as manifestUtils from './manifest.utils';
import {
  MarketMakingResultsChecker,
  ProgressCheckResult,
} from './progress-checking';
import { CampaignStatus } from './types';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatsRepository } from './volume-stats.repository';
import { ExchangeApiClientFactory } from '../exchange';

const mockCampaignsRepository = createMock<CampaignsRepository>();
const mockUserCampaignsRepository = createMock<UserCampaignsRepository>();
const mockVolumeStatsRepository = createMock<VolumeStatsRepository>();
const mockExchangeApiKeysService = createMock<ExchangeApiKeysService>();
const mockStorageService = createMock<StorageService>();
const mockWeb3Service = createMock<Web3Service>();
const mockPgAdvisoryLock = createMock<PgAdvisoryLock>();

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
    const TEST_TOKEN_DECIMALS = 18;

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
        manifestUrl: '',
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
        manifestUrl: faker.internet.url(),
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
          manifestUrl: faker.internet.url(),
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
        manifestUrl,
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

    it('should throw when exchange from manifest not supported', async () => {
      const manifestUrl = faker.internet.url();
      const manifestHash = faker.string.hexadecimal();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: faker.number.bigInt().toString(),
        manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateCampaignManifest();
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
        manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateCampaignManifest();
      mockedManifest.type = faker.lorem.word();
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
      expect(thrownError.address).toBe(campaignAddress);

      expect(thrownError.details).toBe(
        `Campaign type not supported: ${mockedManifest.type}`,
      );
    });

    it('should retrieve and return data (manifest url)', async () => {
      const manifestUrl = faker.internet.url();
      const manifestHash = faker.string.hexadecimal();
      const totalFundedAmount = faker.number.bigInt().toString();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount,
        manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateCampaignManifest();
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
      });

      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledTimes(1);
      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledWith(
        manifestUrl,
        manifestHash,
      );
    });

    it('should retrieve and return data (manifest json)', async () => {
      const mockedManifest = generateCampaignManifest();
      const totalFundedAmount = faker.number.bigInt().toString();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        token: faker.finance.ethereumAddress(),
        totalFundedAmount,
        manifestUrl: JSON.stringify(mockedManifest),
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
      });

      expect(spyOnDownloadCampaignManifest).not.toHaveBeenCalled();
    });
  });

  describe('createCampaign', () => {
    it('should create campaign with proper data', async () => {
      const chainId = generateTestnetChainId();
      const campaignAddress = faker.finance.ethereumAddress();
      const manifest = generateCampaignManifest();
      const fundAmount = faker.number.float();
      const fundTokenSymbol = faker.finance.currencyCode();

      const campaign = await campaignsService.createCampaign(
        chainId,
        campaignAddress,
        manifest,
        {
          fundAmount,
          fundTokenSymbol,
        },
      );

      expect(isUuidV4(campaign.id)).toBe(true);

      const expectedCampaignData = {
        id: expect.any(String),
        chainId,
        address: campaignAddress,
        type: manifest.type,
        exchangeName: manifest.exchange,
        dailyVolumeTarget: manifest.daily_volume_target.toString(),
        pair: manifest.pair,
        startDate: manifest.start_date,
        endDate: manifest.end_date,
        lastResultsAt: null,
        status: 'active',
        fundAmount: fundAmount.toString(),
        fundToken: fundTokenSymbol,
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

      const id = await campaignsService.join(userId, chainId, campaign.address);

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

      const spyOnretrieveCampaignData = jest.spyOn(
        campaignsService as any,
        'retrieveCampaignData',
      );
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
      const exchangeApiKeyId = faker.string.uuid();
      mockExchangeApiKeysService.assertUserHasAuthorizedKeys.mockResolvedValueOnce(
        exchangeApiKeyId,
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
        exchangeApiKeyId,
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
        status: testStatus as CampaignStatus,
        limit: testLimit,
        skip: testSkip,
      });

      expect(campaigns).toEqual(userCampaigns);
      expect(mockUserCampaignsRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(mockUserCampaignsRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        {
          status: testStatus,
          limit: testLimit,
          skip: testSkip,
        },
      );
    });
  });

  describe('getCampaignProgressChecker', () => {
    it('should return market making checker for any type', () => {
      const campaign = generateCampaignEntity();
      campaign.type = faker.lorem.word();

      const checker = campaignsService['getCampaignProgressChecker'](
        campaign.type,
        generateProgressCheckerSetup(),
      );

      expect(checker).toBeInstanceOf(MarketMakingResultsChecker);
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

      const mockIntermediateResulsData = {
        anything: faker.string.sample(),
      };
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
      const stringifieResultsData = JSON.stringify(intermediateResultsData);

      const resultsHash = crypto
        .createHash('sha256')
        .update(stringifieResultsData)
        .digest('hex');

      const recordingResult = await campaignsService[
        'recordCampaignIntermediateResults'
      ](intermediateResultsData);

      expect(recordingResult.url).toBe(mockedResultsFileUrl);
      expect(recordingResult.hash).toBe(resultsHash);

      expect(mockStorageService.uploadData).toHaveBeenCalledTimes(1);
      expect(mockStorageService.uploadData).toHaveBeenCalledWith(
        stringifieResultsData,
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
    const mockMarketMakingResultsChecker =
      createMock<MarketMakingResultsChecker>();

    let spyOnGetCampaignProgressChecker: jest.SpyInstance;

    let periodStart: Date;
    let periodEnd: Date;
    let campaign: CampaignEntity;
    let mockParticipantOutcome: ProgressCheckResult;

    beforeAll(() => {
      periodEnd = new Date();
      periodStart = dayjs(periodEnd).subtract(1, 'day').toDate();
      campaign = generateCampaignEntity();

      mockParticipantOutcome = {
        abuseDetected: false,
        totalVolume: faker.number.float(),
        score: faker.number.float(),
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
      mockMarketMakingResultsChecker.checkForParticipant.mockResolvedValue(
        mockParticipantOutcome,
      );
      mockExchangeApiKeysService.retrieve.mockImplementation(
        async (userId) => ({
          apiKey: `${userId}-apiKey`,
          secretKey: `${userId}-secretKey`,
        }),
      );
      spyOnGetCampaignProgressChecker.mockReturnValueOnce(
        mockMarketMakingResultsChecker,
      );
    });

    it('should return results in correct format', async () => {
      const participant = generateUserEntity();

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        [participant],
        periodStart,
        periodEnd,
      );

      expect(progress.from).toBe(periodStart.toISOString());
      expect(progress.to).toBe(periodEnd.toISOString());
      expect(progress.total_volume).toBe(mockParticipantOutcome.totalVolume);
      expect(progress.participants_outcomes_batches.length).toBe(1);

      const participantsOutcomeBatch =
        progress.participants_outcomes_batches[0];
      expect(isUuidV4(participantsOutcomeBatch.id)).toBe(true);
      expect(participantsOutcomeBatch.results).toEqual([
        {
          address: participant.evmAddress,
          score: mockParticipantOutcome.score,
          total_volume: mockParticipantOutcome.totalVolume,
        },
      ]);
    });

    it('should calculate results for each participant', async () => {
      const participants = [generateUserEntity(), generateUserEntity()];

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        participants,
        periodStart,
        periodEnd,
      );

      expect(progress.total_volume).toBe(
        mockParticipantOutcome.totalVolume * participants.length,
      );

      for (const { id: participantId } of participants) {
        expect(mockExchangeApiKeysService.retrieve).toHaveBeenCalledWith(
          participantId,
          campaign.exchangeName,
        );
        expect(
          mockMarketMakingResultsChecker.checkForParticipant,
        ).toHaveBeenCalledWith({
          apiKey: `${participantId}-apiKey`,
          secret: `${participantId}-secretKey`,
        });
      }
    });

    it('should return batched results', async () => {
      const participants = [
        generateUserEntity(),
        generateUserEntity(),
        generateUserEntity(),
      ];

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        participants,
        periodStart,
        periodEnd,
      );

      expect(progress.total_volume).toBe(
        mockParticipantOutcome.totalVolume * participants.length,
      );
      expect(progress.participants_outcomes_batches.length).toBe(2);
      expect(progress.participants_outcomes_batches[0].results.length).toBe(2);
      expect(progress.participants_outcomes_batches[1].results.length).toBe(1);
    });

    it('should skip participant results if abuse detected', async () => {
      const abuseParticipant = generateUserEntity();
      const normalParticipant = generateUserEntity();

      const normalParticipantResult = {
        abuseDetected: false,
        score: faker.number.float(),
        totalVolume: faker.number.float(),
      };
      mockMarketMakingResultsChecker.checkForParticipant.mockResolvedValueOnce({
        abuseDetected: true,
        score: 0,
        totalVolume: 0,
      });
      mockMarketMakingResultsChecker.checkForParticipant.mockResolvedValueOnce(
        normalParticipantResult,
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        [abuseParticipant, normalParticipant],
        periodStart,
        periodEnd,
      );

      expect(progress.total_volume).toBe(normalParticipantResult.totalVolume);
      expect(progress.participants_outcomes_batches.length).toBe(1);
      expect(progress.participants_outcomes_batches[0].results.length).toBe(1);
      expect(progress.participants_outcomes_batches[0].results[0]).toEqual({
        address: normalParticipant.evmAddress,
        score: normalParticipantResult.score,
        total_volume: normalParticipantResult.totalVolume,
      });

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Abuse detected. Skipping participant outcome',
        {
          campaignId: campaign.id,
          participantId: abuseParticipant.id,
          startDate: periodStart,
          endDate: periodEnd,
        },
      );
    });
  });

  describe('recordCampaignProgress', () => {
    const participants = [generateUserEntity()];
    let spyOnRetrieveCampaignIntermediateResults: jest.SpyInstance;
    let spyOnCheckCampaignProgressForPeriod: jest.SpyInstance;
    let spyOnRecordCampaignIntermediateResults: jest.SpyInstance;
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
    });

    afterAll(() => {
      spyOnRetrieveCampaignIntermediateResults.mockRestore();
      spyOnCheckCampaignProgressForPeriod.mockRestore();
      spyOnRecordCampaignIntermediateResults.mockRestore();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();

      mockPgAdvisoryLock.withLock.mockImplementationOnce(async (_key, fn) => {
        await fn();
      });
      mockUserCampaignsRepository.findCampaignUsers.mockResolvedValueOnce(
        participants,
      );
    });

    it('should run with pessimistic lock', async () => {
      await campaignsService.recordCampaignProgress(campaign);

      expect(mockPgAdvisoryLock.withLock).toHaveBeenCalledTimes(1);
      expect(mockPgAdvisoryLock.withLock).toHaveBeenCalledWith(
        `record-campaign-progress:${campaign.id}`,
        expect.any(Function),
      );
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
          generateIntermediateResult(),
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
        participants,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should evaluate start date from last intermediate results', async () => {
      const lastResultsEndDate = dayjs().subtract(2, 'days').toDate();

      const intermediateResultsData = generateIntermediateResultsData({
        results: [generateIntermediateResult(lastResultsEndDate)],
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
        participants,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should not check progress if less than a day from last results', async () => {
      jest.useFakeTimers({ now: new Date() });

      const oneDayAgo = dayjs().subtract(1, 'day').toDate();

      const intermediateResultsData = generateIntermediateResultsData({
        results: [
          generateIntermediateResult(
            dayjs(oneDayAgo).subtract(1, 'day').toDate(),
          ),
          generateIntermediateResult(
            // add one ms to imitate "almost one day ago"
            new Date(oneDayAgo.valueOf() + 1),
          ),
        ],
      });
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      await campaignsService.recordCampaignProgress(campaign);

      jest.useRealTimers();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);
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
        participants,
        expectedStartDate,
        expectedEndDate,
      );
    });

    it('should record campaign progress when no results yet', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const intermediateResult = generateIntermediateResult();
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        intermediateResult,
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith({
        chain_id: campaign.chainId,
        address: campaign.address,
        exchange: campaign.exchangeName,
        pair: campaign.pair,
        results: [intermediateResult],
      });
    });

    it('should record campaign progress to existing results', async () => {
      const intermediateResultsData = generateIntermediateResultsData({
        results: [generateIntermediateResult()],
      });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      const newIntermediateResult = generateIntermediateResult();
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        newIntermediateResult,
      );

      const expectedNewIntermediateResultsData = {
        ...intermediateResultsData,
        results: [...intermediateResultsData.results, newIntermediateResult],
      };

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expectedNewIntermediateResultsData,
      );
    });

    it('should not move campaign to "pending_completion" if not ended yet', async () => {
      const now = new Date();
      jest.useFakeTimers({ now });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateIntermediateResult(),
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
        generateIntermediateResult(lastResultsEndDate),
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
          results: [generateIntermediateResult(lastResultsEndDate)],
        }),
      );
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateIntermediateResult(campaign.endDate),
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
          results: [generateIntermediateResult(campaign.endDate)],
        }),
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
      expect(mockVolumeStatsRepository.upsert).toHaveBeenCalledTimes(0);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(0);
    });

    it('should record generated volume stat', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const intermediateResult = generateIntermediateResult();
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        intermediateResult,
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(mockVolumeStatsRepository.upsert).toHaveBeenCalledTimes(1);
      expect(mockVolumeStatsRepository.upsert).toHaveBeenCalledWith(
        {
          exchangeName: campaign.exchangeName,
          campaignAddress: campaign.address,
          periodStart: new Date(intermediateResult.from),
          periodEnd: new Date(intermediateResult.to),
          volume: intermediateResult.total_volume.toString(),
        },
        ['exchangeName', 'campaignAddress', 'periodStart'],
      );
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
});
