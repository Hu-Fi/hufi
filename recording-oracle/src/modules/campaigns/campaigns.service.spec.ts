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

import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { isUuidV4 } from '@/common/validators';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import {
  ExchangeApiKeyNotFoundError,
  ExchangeApiKeysRepository,
  ExchangeApiKeysService,
} from '@/modules/exchange-api-keys';
import { generateExchangeApiKey } from '@/modules/exchange-api-keys/fixtures';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '@/modules/web3/fixtures';

import { CampaignEntity } from './campaign.entity';
import { CampaignNotFoundError, InvalidCampaign } from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import {
  generateCampaignManifest,
  generateIntermediateResult,
  generateIntermediateResultsData,
} from './fixtures';
import { generateCampaignEntity } from './fixtures';
import * as manifestUtils from './manifest.utils';
import {
  MarketMakingResult,
  MarketMakingResultsChecker,
} from './progress-checkers';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { generateUserEntity } from '../users/fixtures';

const mockCampaignsRepository = createMock<CampaignsRepository>();
const mockUserCampaignsRepository = createMock<UserCampaignsRepository>();
const mockExchangeApiKeysRepository = createMock<ExchangeApiKeysRepository>();
const mockExchangeApiKeysService = createMock<ExchangeApiKeysService>();
const mockStorageService = createMock<StorageService>();
const mockWeb3Service = createMock<Web3Service>();
const mockPgAdvisoryLock = createMock<PgAdvisoryLock>();
const mockMarketMakingResultsChecker = createMock<MarketMakingResultsChecker>();

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
          provide: UserCampaignsRepository,
          useValue: mockUserCampaignsRepository,
        },
        {
          provide: ExchangeApiKeysRepository,
          useValue: mockExchangeApiKeysRepository,
        },
        {
          provide: ExchangeApiKeysService,
          useValue: mockExchangeApiKeysService,
        },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        {
          provide: PgAdvisoryLock,
          useValue: mockPgAdvisoryLock,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        {
          provide: MarketMakingResultsChecker,
          useValue: mockMarketMakingResultsChecker,
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

  describe('retrieveCampaignManifest', () => {
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
    });

    it('should throw when escrow not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(null as any);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignManifest'](
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

    it('should throw when escrow is for different recording oracle', async () => {
      const escrowRecordingOracle = faker.finance.ethereumAddress();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        recordingOracle: escrowRecordingOracle,
      } as any);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignManifest'](
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
          recordingOracle: mockWeb3ConfigService.operatorAddress,
        } as any);
        mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

        let thrownError;
        try {
          await campaignsService['retrieveCampaignManifest'](
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
        manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const syntheticError = new Error(faker.lorem.sentence());
      spyOnDownloadCampaignManifest.mockRejectedValueOnce(syntheticError);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignManifest'](
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
        manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateCampaignManifest();
      mockedManifest.exchange = faker.lorem.word();
      spyOnDownloadCampaignManifest.mockResolvedValueOnce(mockedManifest);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignManifest'](
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
        manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateCampaignManifest();
      mockedManifest.type = faker.lorem.word();
      spyOnDownloadCampaignManifest.mockResolvedValueOnce(mockedManifest);

      let thrownError;
      try {
        await campaignsService['retrieveCampaignManifest'](
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

    it('should download and return manifest', async () => {
      const manifestUrl = faker.internet.url();
      const manifestHash = faker.string.hexadecimal();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        manifestUrl,
        manifestHash,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
      } as any);
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Pending);

      const mockedManifest = generateCampaignManifest();
      spyOnDownloadCampaignManifest.mockResolvedValueOnce(mockedManifest);

      const manifest = await campaignsService['retrieveCampaignManifest'](
        chainId,
        campaignAddress,
      );

      expect(manifest).toEqual(mockedManifest);

      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledTimes(1);
      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledWith(
        manifestUrl,
        manifestHash,
      );
    });
  });

  describe('createCampaign', () => {
    it('should create campaign with proper data', async () => {
      const chainId = generateTestnetChainId();
      const campaignAddress = faker.finance.ethereumAddress();
      const manifest = generateCampaignManifest();

      const campaign = await campaignsService.createCampaign(
        chainId,
        campaignAddress,
        manifest,
      );

      expect(isUuidV4(campaign.id)).toBe(true);

      const expectedCampaignData = {
        id: expect.any(String),
        chainId,
        address: campaignAddress,
        type: manifest.type,
        exchangeName: manifest.exchange,
        dailyVolumeTarget: manifest.daily_volume_target,
        pair: manifest.pair,
        startDate: manifest.start_date,
        endDate: manifest.end_date,
        lastResultsAt: null,
        status: 'active',
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
    let campaignAddress: string;

    beforeEach(() => {
      campaign = generateCampaignEntity();
      userId = faker.string.uuid();
      chainId = generateTestnetChainId();
      campaignAddress = faker.finance.ethereumAddress();
    });

    it('should return campaign id if exists and user already joined', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        true,
      );

      const id = await campaignsService.join(userId, chainId, campaignAddress);

      expect(id).toBe(campaign.id);

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaignAddress);

      expect(
        mockUserCampaignsRepository.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it('should throw when exchange api key not found for exchange from campaign', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        false,
      );
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        null,
      );

      let thrownError;
      try {
        await campaignsService.join(userId, chainId, campaignAddress);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ExchangeApiKeyNotFoundError);
      expect(thrownError.userId).toBe(userId);
      expect(thrownError.exchangeName).toBe(campaign.exchangeName);

      expect(
        mockExchangeApiKeysRepository.findOneByUserAndExchange,
      ).toHaveBeenCalledWith(userId, campaign.exchangeName);
    });

    it('should create campaign when not exist and join user', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        null,
      );

      const spyOnRetrieveCampaignManifest = jest.spyOn(
        campaignsService as any,
        'retrieveCampaignManifest',
      );
      const spyOnCreateCampaign = jest.spyOn(
        campaignsService,
        'createCampaign',
      );
      const campaignManifest = generateCampaignManifest();
      spyOnRetrieveCampaignManifest.mockResolvedValueOnce(campaignManifest);

      mockUserCampaignsRepository.checkUserJoinedCampaign.mockResolvedValueOnce(
        false,
      );
      const exchangeApiKey = generateExchangeApiKey();
      mockExchangeApiKeysRepository.findOneByUserAndExchange.mockResolvedValueOnce(
        exchangeApiKey,
      );

      const now = new Date();
      jest.useFakeTimers({ now });

      const campaignId = await campaignsService.join(
        userId,
        chainId,
        campaignAddress,
      );

      expect(isUuidV4(campaignId)).toBe(true);

      expect(spyOnRetrieveCampaignManifest).toHaveBeenCalledTimes(1);
      expect(spyOnRetrieveCampaignManifest).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
      );

      expect(spyOnCreateCampaign).toHaveBeenCalledTimes(1);
      expect(spyOnCreateCampaign).toHaveBeenCalledWith(
        chainId,
        campaignAddress,
        campaignManifest,
      );

      expect(mockUserCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockUserCampaignsRepository.insert).toHaveBeenCalledWith({
        userId,
        campaignId,
        exchangeApiKeyId: exchangeApiKey.id,
        createdAt: now,
      });

      spyOnRetrieveCampaignManifest.mockRestore();
      spyOnCreateCampaign.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('getJoined', () => {
    it('should return campaign addresses where user is participant', async () => {
      const userId = faker.string.uuid();
      const userCampaigns = Array.from({ length: 3 }, () => {
        const campaign = generateCampaignEntity();

        return {
          userId,
          campaignId: campaign.id,
          campaign: generateCampaignEntity(),
          exchangeApiKeyId: faker.string.uuid(),
          createdAt: faker.date.recent(),
        };
      });
      mockUserCampaignsRepository.findByUserId.mockResolvedValueOnce(
        userCampaigns,
      );

      const campaigns = await campaignsService.getJoined(userId);

      expect(campaigns).toEqual(userCampaigns.map((e) => e.campaign.address));
      expect(mockUserCampaignsRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(mockUserCampaignsRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        {
          relations: { campaign: true },
        },
      );
    });
  });

  describe('getCampaignProgressChecker', () => {
    it('should return market making checker for any type', () => {
      const checker = campaignsService['getCampaignProgressChecker'](
        faker.lorem.word(),
      );

      expect(checker).toBe(mockMarketMakingResultsChecker);
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
    let periodStart: Date;
    let periodEnd: Date;
    let campaign: CampaignEntity;
    let mockParticipantOutcome: MarketMakingResult;

    beforeAll(() => {
      periodEnd = new Date();
      periodStart = dayjs(periodEnd).subtract(1, 'day').toDate();
      campaign = generateCampaignEntity();

      mockParticipantOutcome = {
        totalVolume: faker.number.float(),
        score: faker.number.float(),
      };
    });

    beforeEach(() => {
      mockMarketMakingResultsChecker.check.mockResolvedValue(
        mockParticipantOutcome,
      );
      mockExchangeApiKeysService.retrieve.mockImplementation(
        async (userId) => ({
          apiKey: `${userId}-apiKey`,
          secretKey: `${userId}-secretKey`,
        }),
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
        expect(mockMarketMakingResultsChecker.check).toHaveBeenCalledWith({
          exchangeName: campaign.exchangeName,
          apiClientOptions: {
            apiKey: `${participantId}-apiKey`,
            secret: `${participantId}-secretKey`,
          },
          pair: campaign.pair,
          startDate: periodStart,
          endDate: periodEnd,
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

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(0);

      jest.useRealTimers();
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

    it('should not complete campaign if not ended yet', async () => {
      const now = new Date();
      jest.useFakeTimers({ now });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateIntermediateResult(),
      );

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'active',
        lastResultsAt: now,
      });

      jest.useRealTimers();
    });

    it('should complete campaign if reached its end date', async () => {
      const now = new Date();
      campaign.endDate = new Date(now.valueOf() - 1);
      campaign.startDate = faker.date.past({ refDate: campaign.endDate });

      jest.useFakeTimers({ now });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        generateIntermediateResult(),
      );

      await campaignsService.recordCampaignProgress(
        Object.assign({}, campaign),
      );

      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(mockCampaignsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.save).toHaveBeenCalledWith({
        ...campaign,
        status: 'completed',
        lastResultsAt: now,
      });

      jest.useRealTimers();
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
