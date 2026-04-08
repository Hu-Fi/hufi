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

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  type IEscrow,
  OrderDirection,
} from '@human-protocol/sdk';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import _ from 'lodash';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangeNotSupportedError } from '@/common/errors/exchanges';
import * as cryptoUtils from '@/common/utils/crypto';
import * as escrowUtils from '@/common/utils/escrow';
import * as httpUtils from '@/common/utils/http';
import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { isUuidV4 } from '@/common/validators';
import {
  CampaignsConfigService,
  ExchangesConfigService,
  Web3ConfigService,
} from '@/config';
import { CacheManager, CacheManagerMock } from '@/infrastructure/cache';
import logger from '@/logger';
import {
  ExchangeApiAccessError,
  ExchangeApiClientError,
  ExchangeApiClientFactory,
  ExchangeApiKeyNotFoundError,
  ExchangePermission,
  ExchangesService,
  PancakeswapClient,
} from '@/modules/exchanges';
import { mockExchangesConfigService } from '@/modules/exchanges/fixtures';
import { StorageService } from '@/modules/storage';
import { WalletWithProvider, Web3Service } from '@/modules/web3';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '@/modules/web3/fixtures';

import { type CampaignEntity } from './campaign.entity';
import { CampaignsCache } from './campaigns-cache';
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
import { CAMPAIGNS_DAILY_CYCLE } from './constants';
import {
  generateBaseCampaignManifest,
  generateCampaignEntity,
  generateCampaignManifest,
  generateCampaignParticipant,
  generateCampaignProgress,
  generateCompetitiveMarketMakingCampaignManifest,
  generateHoldingCampaignManifest,
  generateIntermediateResult,
  generateIntermediateResultsData,
  generateMarketMakingCampaignManifest,
  generateParticipantOutcome,
  generateStoredResultsMeta,
  generateThresholdampaignManifest,
  generateUserJoinedDate,
  MockCampaignProgressChecker,
  mockCampaignsConfigService,
  MockProgressCheckResult,
} from './fixtures';
import * as manifestUtils from './manifest.utils';
import {
  type CampaignParticipant,
  ParticipationsRepository,
  ParticipationsService,
  UserAlreadyJoinedError,
} from './participations';
import {
  type CampaignProgressMeta,
  HoldingProgressChecker,
  MarketMakingProgressChecker,
} from './progress-checking';
import { type HoldingMeta } from './progress-checking/holding';
import { type MarketMakingMeta } from './progress-checking/market-making';
import {
  type ThresholdMeta,
  ThresholdProgressChecker,
} from './progress-checking/threshold';
import * as rewardsUtils from './rewards.utils';
import {
  isCompetitiveMarketMakingCampaign,
  isThresholdCampaign,
} from './type-guards';
import {
  type CampaignProgress,
  CampaignStatus,
  CampaignType,
  type CompetitiveMarketMakingCampaignDetails,
  type HoldingCampaignDetails,
  type IntermediateResultsData,
  type MarketMakingCampaignDetails,
  type ThresholdCampaignDetails,
  type ThresholdCampaignManifest,
} from './types';
import { VolumeStatsRepository } from './volume-stats.repository';

const mockCacheManager = new CacheManagerMock();

const mockCampaignsRepository = createMock<CampaignsRepository>();
const mockParticipationsRepository = createMock<ParticipationsRepository>();
const mockParticipationsService = createMock<ParticipationsService>();
const mockVolumeStatsRepository = createMock<VolumeStatsRepository>();
const mockExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();
const mockExchangesService = createMock<ExchangesService>();
const mockStorageService = createMock<StorageService>();
const mockPgAdvisoryLock = createMock<PgAdvisoryLock>();
const mockSchedulerRegistry = createMock<SchedulerRegistry>();

const mockWeb3Service = createMock<Web3Service>();
(mockWeb3Service.supportedChainIds as any) = [];
const mockedSigner = createMock<WalletWithProvider>();

const mockedEscrowClient = jest.mocked(EscrowClient);
const mockedEscrowUtils = jest.mocked(EscrowUtils);

const mockedPancakeswapClient = createMock<PancakeswapClient>();

const exchangePermissions = Object.values(ExchangePermission);

it('campaign progress cycle duration should be 1 day', () => {
  expect(CAMPAIGNS_DAILY_CYCLE).toBe(1);
});

describe('CampaignsService', () => {
  let campaignsService: CampaignsService;
  let campaignsCache: CampaignsCache;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: CacheManager,
          useValue: mockCacheManager,
        },
        CampaignsCache,
        {
          provide: CampaignsConfigService,
          useValue: mockCampaignsConfigService,
        },
        {
          provide: CampaignsRepository,
          useValue: mockCampaignsRepository,
        },
        {
          provide: ExchangesConfigService,
          useValue: mockExchangesConfigService,
        },
        {
          provide: ExchangeApiClientFactory,
          useValue: mockExchangeApiClientFactory,
        },
        {
          provide: ExchangesService,
          useValue: mockExchangesService,
        },
        {
          provide: ParticipationsRepository,
          useValue: mockParticipationsRepository,
        },
        {
          provide: ParticipationsService,
          useValue: mockParticipationsService,
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
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
      ],
    }).compile();

    campaignsService = moduleRef.get<CampaignsService>(CampaignsService);
    campaignsCache = moduleRef.get<CampaignsCache>(CampaignsCache);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(campaignsService).toBeDefined();
  });

  describe('assertCorrectCampaignSetup', () => {
    afterEach(() => {
      mockExchangesConfigService.configByExchange = {};
    });

    it('should throw when exchange from manifest not supported', () => {
      const manifest = generateCampaignManifest();

      let thrownError: any;
      try {
        campaignsService['assertCorrectCampaignSetup'](manifest);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ExchangeNotSupportedError);
      expect(thrownError.exchangeName).toBe(manifest.exchange);
    });

    it('should throw when exchange from manifest supported but disabled', () => {
      const manifest = generateCampaignManifest();

      mockExchangesConfigService.configByExchange = {
        [manifest.exchange]: {
          enabled: false,
          type: ExchangeType.CEX,
        },
      };

      let thrownError: any;
      try {
        campaignsService['assertCorrectCampaignSetup'](manifest);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Exchange integration is disabled');
    });

    it.each([ExchangeName.PANCAKESWAP, ExchangeName.HYPERLIQUID])(
      'should throw when exchange from manifest is %s and not market making type',
      (exchangeName) => {
        const manifest = faker.helpers.arrayElement([
          generateHoldingCampaignManifest,
          generateThresholdampaignManifest,
        ])();
        manifest.exchange = exchangeName;

        mockExchangesConfigService.configByExchange = {
          [manifest.exchange]: {
            enabled: true,
            type: ExchangeType.DEX,
          },
        };

        let thrownError: any;
        try {
          campaignsService['assertCorrectCampaignSetup'](manifest);
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe(
          `Only market making campaigns supported for ${exchangeName}`,
        );
      },
    );

    it('should not throw when campaign setup is correct', () => {
      /**
       * Use random exchange name to avoid flakiness
       * that might appear due to exchange-specific params
       */
      const exchangeName = faker.lorem.slug();
      const manifest = generateMarketMakingCampaignManifest();
      manifest.exchange = exchangeName;

      mockExchangesConfigService.configByExchange = {
        [manifest.exchange]: {
          enabled: true,
          type: ExchangeType.CEX,
        },
      };

      expect(
        campaignsService['assertCorrectCampaignSetup'](manifest),
      ).toBeUndefined();
    });
  });

  describe('retrieveCampaignData', () => {
    const TEST_TOKEN_SYMBOL = faker.finance.currencyCode();
    const TEST_TOKEN_DECIMALS = faker.helpers.arrayElement([6, 18]);

    const mockedGetEscrowStatus = jest.fn();

    let spyOnDownloadCampaignManifest: jest.SpyInstance;
    let spyOnAssertCorrectCampaignSetup: jest.SpyInstance;
    let chainId: number;
    let campaignAddress: string;

    beforeAll(() => {
      spyOnDownloadCampaignManifest = jest.spyOn(
        manifestUtils,
        'downloadCampaignManifest',
      );
      spyOnDownloadCampaignManifest.mockImplementation();

      spyOnAssertCorrectCampaignSetup = jest.spyOn(
        campaignsService as any,
        'assertCorrectCampaignSetup',
      );
      spyOnAssertCorrectCampaignSetup.mockImplementation();
    });

    afterAll(() => {
      spyOnDownloadCampaignManifest.mockRestore();
      spyOnAssertCorrectCampaignSetup.mockRestore();
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

      let thrownError: any;
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

        expect(spyOnAssertCorrectCampaignSetup).toHaveBeenCalledTimes(1);
        expect(spyOnAssertCorrectCampaignSetup).toHaveBeenCalledWith(manifest);
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

        expect(spyOnAssertCorrectCampaignSetup).toHaveBeenCalledTimes(1);
        expect(spyOnAssertCorrectCampaignSetup).toHaveBeenCalledWith(manifest);
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
        resultsCutoffAt: null,
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
        resultsCutoffAt: null,
      };
      expect(campaign).toEqual(expectedCampaignData);

      expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.insert).toHaveBeenCalledWith(
        expectedCampaignData,
      );
    });

    it('should create competitive market making campaign with proper data', async () => {
      const chainId = generateTestnetChainId();
      const campaignAddress = faker.finance.ethereumAddress();
      const manifest = generateCompetitiveMarketMakingCampaignManifest();
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
          minVolumeRequired: manifest.min_volume_required,
          rewardsDistribution: manifest.rewards_distribution,
        },
        status: 'active',
        lastResultsAt: null,
        resultsCutoffAt: null,
      };
      expect(campaign).toEqual(expectedCampaignData);

      expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockCampaignsRepository.insert).toHaveBeenCalledWith(
        expectedCampaignData,
      );
    });

    describe('threshold campaign creation', () => {
      let chainId: number;
      let campaignAddress: string;
      let manifest: ThresholdCampaignManifest;
      let fundAmount: number;
      let fundTokenSymbol: string;
      let fundTokenDecimals: number;

      beforeEach(() => {
        chainId = generateTestnetChainId();
        campaignAddress = faker.finance.ethereumAddress();
        manifest = generateThresholdampaignManifest();
        fundAmount = faker.number.float();
        fundTokenSymbol = faker.finance.currencyCode();
        fundTokenDecimals = faker.number.int({ min: 6, max: 18 });
      });

      it('should create with proper data', async () => {
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
          details: expect.objectContaining({
            minimumBalanceTarget: manifest.minimum_balance_target,
          }),
          status: 'active',
          lastResultsAt: null,
          resultsCutoffAt: null,
        };
        expect(campaign).toEqual(expectedCampaignData);

        expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
        expect(mockCampaignsRepository.insert).toHaveBeenCalledWith(
          expectedCampaignData,
        );
      });

      it('should create with maxParticipants in details when it is in manifest', async () => {
        manifest = generateThresholdampaignManifest({
          shouldHaveMaxParticipants: true,
        });

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
        expect(campaign.details).toEqual({
          minimumBalanceTarget: manifest.minimum_balance_target,
          maxParticipants: manifest.max_participants,
        });
        expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      });

      it('should create without maxParticipants in details when manifest does not have it', async () => {
        manifest = generateThresholdampaignManifest({
          shouldHaveMaxParticipants: false,
        });

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
        expect(campaign.details).toEqual({
          minimumBalanceTarget: manifest.minimum_balance_target,
        });
        expect(mockCampaignsRepository.insert).toHaveBeenCalledTimes(1);
      });
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

    it('should throw when user already joined', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        generateUserJoinedDate(campaign),
      );

      let thrownError: any;
      try {
        await campaignsService.join(
          userId,
          chainId,
          // not checksummed address
          campaign.address.toLowerCase(),
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(UserAlreadyJoinedError);
      expect(thrownError.userId).toBe(userId);
      expect(thrownError.campaignId).toBe(campaign.id);

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);
      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
      expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(0);
    });

    it('should return campaign id if campaign exists and user not joined yet', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
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
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);

      expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(1);
      expect(mockParticipationsService.joinCampaign).toHaveBeenCalledWith(
        userId,
        campaign,
      );
    });

    it('should re-throw error when exchange api keys not authorized for exchange from campaign', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );
      const testError = new Error(faker.lorem.sentence());
      mockExchangesService.assertUserHasRequiredAccess.mockRejectedValueOnce(
        testError,
      );

      let thrownError: any;
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

      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );
      mockExchangesService.assertUserHasRequiredAccess.mockResolvedValueOnce();

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

      const expectedCampaignEntity =
        await spyOnCreateCampaign.mock.results.at(-1)?.value;
      expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(1);
      expect(mockParticipationsService.joinCampaign).toHaveBeenCalledWith(
        userId,
        expectedCampaignEntity,
      );

      spyOnretrieveCampaignData.mockRestore();
      spyOnCreateCampaign.mockRestore();
    });

    it('should throw when joining campaign that reached its end date', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.Partial);

      campaign.endDate = faker.date.past();
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );

      let thrownError: any;
      try {
        await campaignsService.join(userId, chainId, campaign.address);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(CampaignAlreadyFinishedError);
      expect(thrownError.chainId).toBe(campaign.chainId);
      expect(thrownError.address).toBe(campaign.address);

      expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(0);
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
        mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
          null,
        );
        mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

        let thrownError: any;
        try {
          await campaignsService.join(userId, chainId, campaign.address);
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(errorClass);
        expect(thrownError.chainId).toBe(campaign.chainId);
        expect(thrownError.address).toBe(campaign.address);

        expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(0);
      },
    );
  });

  describe('getCampaignProgressChecker', () => {
    it('should return market making checker for its type', () => {
      const campaign = generateCampaignEntity(CampaignType.MARKET_MAKING);

      const checker = campaignsService['getCampaignProgressChecker'](
        campaign.type,
        {
          exchangeName: campaign.exchangeName as ExchangeName,
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
          exchangeName: campaign.exchangeName as ExchangeName,
          symbol: campaign.symbol,
          periodStart: faker.date.recent(),
          periodEnd: faker.date.soon(),
        },
      );

      expect(checker).toBeInstanceOf(HoldingProgressChecker);
    });

    it('should return market making checker for competitive market making type', () => {
      const campaign = generateCampaignEntity(
        CampaignType.COMPETITIVE_MARKET_MAKING,
      );

      const checker = campaignsService['getCampaignProgressChecker'](
        campaign.type,
        {
          exchangeName: campaign.exchangeName as ExchangeName,
          symbol: campaign.symbol,
          periodStart: faker.date.recent(),
          periodEnd: faker.date.soon(),
        },
      );

      expect(checker).toBeInstanceOf(MarketMakingProgressChecker);
    });

    it('should return threshold checker for its type', () => {
      const campaign = generateCampaignEntity(CampaignType.THRESHOLD);

      const checker = campaignsService['getCampaignProgressChecker'](
        campaign.type,
        {
          exchangeName: campaign.exchangeName as ExchangeName,
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

      let thrownError: any;
      try {
        campaignsService['getCampaignProgressChecker'](campaign.type, {
          exchangeName: campaign.exchangeName as ExchangeName,
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

      expect(results).toBeNull();
    });

    it('should rethrow download error', async () => {
      const testUrl = faker.internet.url();
      mockGetIntermediateResultsUrl.mockResolvedValueOnce(testUrl);

      const testError = new Error(faker.lorem.sentence());
      spyOnDownloadFile.mockRejectedValueOnce(testError);

      let thrownError: any;
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
    let mockFeeParams: {
      maxFeePerGas: bigint;
      maxPriorityFeePerGas: bigint;
    };
    let mockLatestNonce: number;

    beforeEach(() => {
      mockedEscrowClient.build.mockResolvedValue({
        storeResults: mockStoreResults,
      } as unknown as EscrowClient);
      mockWeb3Service.getSigner.mockReturnValueOnce(mockedSigner);

      mockFeeParams = {
        maxFeePerGas: faker.number.bigInt({ min: 1 }),
        maxPriorityFeePerGas: faker.number.bigInt({ min: 1 }),
      };
      mockWeb3Service.calculateTxFees.mockResolvedValueOnce(mockFeeParams);

      mockLatestNonce = faker.number.int();
      mockedSigner.getNonce.mockResolvedValueOnce(mockLatestNonce);
    });

    it('should upload results to storage and store url in escrow', async () => {
      const mockedResultsFileUrl = faker.internet.url();
      mockStorageService.uploadData.mockResolvedValueOnce(mockedResultsFileUrl);

      const intermediateResultsData = generateIntermediateResultsData();
      const stringifiedResultsData = JSON.stringify(intermediateResultsData);

      const resultsHash = cryptoUtils.hashString(
        stringifiedResultsData,
        'sha256',
      );
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

      expect(mockedSigner.getNonce).toHaveBeenCalledTimes(1);
      expect(mockedSigner.getNonce).toHaveBeenCalledWith('latest');

      expect(mockStoreResults).toHaveBeenCalledTimes(1);
      expect(mockStoreResults).toHaveBeenCalledWith(
        intermediateResultsData.address,
        mockedResultsFileUrl,
        resultsHash,
        fundsToReserve,
        {
          ...mockFeeParams,
          nonce: mockLatestNonce,
          timeoutMs: mockCampaignsConfigService.storeResultsTimeout,
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
          caller: 'unknown',
          debugCaller: 'Object.<anonymous>',
          campaignId: campaign.id,
          chainId: campaign.chainId,
          campaignAddress: campaign.address,
          exchangeName: campaign.exchangeName,
          campaignType: campaign.type,
          startDate: periodStart,
          endDate: periodEnd,
          periodDuration: dayjs(periodEnd).diff(periodStart, 'seconds'),
        });
      } finally {
        spyOnLoggerChild.mockRestore();
      }
    });

    it.each([
      CampaignType.MARKET_MAKING,
      CampaignType.COMPETITIVE_MARKET_MAKING,
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
      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
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

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Campaign progress checked', {
        nParticipants: 1,
        checkDurationMs: expect.any(Number),
      });
    });

    it('should calculate results for each participant', async () => {
      const participants = [
        generateCampaignParticipant(campaign),
        generateCampaignParticipant(campaign),
      ];
      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
        participants,
      );

      await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
      );

      for (const participant of participants) {
        expect(
          mockCampaignProgressChecker.checkForParticipant,
        ).toHaveBeenCalledWith(participant);
      }
    });

    it('should skip participant results if abuse detected', async () => {
      const abuseParticipant = generateCampaignParticipant(campaign);
      const normalParticipant = generateCampaignParticipant(campaign);
      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
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
        { logWarnings: true },
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

    it('should skip participant if its api key not found', async () => {
      const normalParticipant = generateCampaignParticipant(campaign);
      const noApiKeyParticipant = generateCampaignParticipant(campaign);
      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [normalParticipant, noApiKeyParticipant],
      );

      const mockedParticipantsResult = {
        abuseDetected: false,
        score: faker.number.float(),
        [mockCampaignProgressMetaProp]: faker.number.float(),
      };
      const noApiKeyError = new ExchangeApiKeyNotFoundError(
        noApiKeyParticipant.id,
        campaign.exchangeName,
      );
      mockCampaignProgressChecker.checkForParticipant.mockImplementation(
        async (participant: CampaignParticipant) => {
          if (participant.id === normalParticipant.id) {
            return mockedParticipantsResult;
          }

          throw noApiKeyError;
        },
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
        { logWarnings: true },
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
        'Participant api key not found',
        {
          participantId: noApiKeyParticipant.id,
          error: noApiKeyError,
        },
      );
    });

    it('should skip participant if it lacks exchange api access and revalidate his api key', async () => {
      const normalParticipant = generateCampaignParticipant(campaign);
      const noAccessParticipant = generateCampaignParticipant(campaign);
      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [normalParticipant, noAccessParticipant],
      );

      const normalParticipantResult = {
        abuseDetected: false,
        score: faker.number.float(),
        [mockCampaignProgressMetaProp]: faker.number.float(),
      };
      const syntheticError = new ExchangeApiAccessError(
        campaign.exchangeName,
        faker.helpers.arrayElement(exchangePermissions),
        `Api access failed for fetch_test_${faker.lorem.word()}`,
      );
      mockCampaignProgressChecker.checkForParticipant.mockImplementation(
        async (participant: CampaignParticipant) => {
          if (participant.id === normalParticipant.id) {
            return normalParticipantResult;
          }

          throw syntheticError;
        },
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
        { logWarnings: true },
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
        'Exchange access failed for provided api key',
        {
          participantId: noAccessParticipant.id,
          participantEvmAddress: noAccessParticipant.evmAddress,
          error: syntheticError,
        },
      );

      expect(mockExchangesService.safeRevalidateApiKey).toHaveBeenCalledTimes(
        1,
      );
      expect(mockExchangesService.safeRevalidateApiKey).toHaveBeenCalledWith(
        noAccessParticipant.id,
        campaign.exchangeName,
      );
    });

    it('should throw when should retry some participant', async () => {
      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
        [
          generateCampaignParticipant(campaign),
          generateCampaignParticipant(campaign),
        ],
      );

      mockCampaignProgressChecker.checkForParticipant.mockResolvedValueOnce({
        abuseDetected: false,
        score: faker.number.float(),
      });
      const syntheticError = new ExchangeApiClientError(
        faker.lorem.sentence(),
        campaign.exchangeName,
      );
      mockCampaignProgressChecker.checkForParticipant.mockRejectedValueOnce(
        syntheticError,
      );

      let thrownError: any;
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

    it('should throw when invalid period passed', async () => {
      [periodStart, periodEnd] = [periodEnd, periodStart];

      try {
        await expect(
          campaignsService.checkCampaignProgressForPeriod(
            campaign,
            periodStart,
            periodEnd,
          ),
        ).rejects.toThrow('Invalid period range provided');
      } finally {
        // set back to valid period for other tests
        [periodStart, periodEnd] = [periodEnd, periodStart];
      }
    });

    it('should exclude participants with zero score if flag is on', async () => {
      const participants = Array.from({ length: 3 }, () =>
        generateCampaignParticipant(campaign),
      );

      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
        participants,
      );
      let callIdx = 0;
      mockCampaignProgressChecker.checkForParticipant.mockImplementation(
        () => ({
          abuseDetected: false,
          score: callIdx++ % 2,
        }),
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
        { excludeIneligible: true },
      );

      expect(
        mockParticipationsRepository.removeParticipation,
      ).toHaveBeenCalledTimes(Math.ceil(participants.length / 2));

      for (const [idx, participant] of participants.entries()) {
        const expectedScore = idx % 2;

        expect(progress.participants_outcomes[idx]).toEqual({
          address: participant.evmAddress,
          score: expectedScore,
        });

        if (expectedScore === 0) {
          expect(
            mockParticipationsRepository.removeParticipation,
          ).toHaveBeenCalledWith(participant.id, campaign.id);
        }
      }
    });

    it('should not exclude participants with zero score if flag is off', async () => {
      const participants = Array.from({ length: 3 }, () =>
        generateCampaignParticipant(campaign),
      );

      mockParticipationsRepository.findCampaignParticipants.mockResolvedValueOnce(
        participants,
      );
      mockCampaignProgressChecker.checkForParticipant.mockImplementation(
        () => ({
          abuseDetected: false,
          score: 0,
        }),
      );

      const progress = await campaignsService.checkCampaignProgressForPeriod(
        campaign,
        periodStart,
        periodEnd,
      );

      expect(
        mockParticipationsRepository.removeParticipation,
      ).toHaveBeenCalledTimes(0);

      for (const [idx, participant] of participants.entries()) {
        expect(progress.participants_outcomes[idx]).toEqual({
          address: participant.evmAddress,
          score: 0,
        });
      }
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
       * Adjust campaign dates to be already ended 1-day campaign
       * to easily manipulate inputs and check for expectations
       */
      campaign.endDate = dayjs().subtract(1, 'hour').toDate();
      campaign.startDate = dayjs(campaign.endDate).subtract(1, 'day').toDate();

      mockPgAdvisoryLock.withLock.mockImplementationOnce(async (_key, fn) => {
        await fn();
      });

      mockedEscrowClient.build.mockResolvedValue({
        getStatus: mockedGetEscrowStatus,
      } as unknown as EscrowClient);
    });

    it('should run with pessimistic lock and correct child logger', async () => {
      const spyOnLoggerChild = jest.spyOn(logger, 'child');

      campaign.resultsCutoffAt = faker.date.recent();
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
          resultsCutoffAt: campaign.resultsCutoffAt.toISOString(),
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
      campaign.endDate = new Date(now + 1);

      campaign.startDate = dayjs(campaign.endDate)
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

      campaign.startDate = dayjs(campaign.endDate)
        .subtract(faker.number.int({ min: 1, max: 23 }), 'hours')
        .toDate();

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        campaign.startDate,
        campaign.endDate,
        {
          excludeIneligible: expect.any(Boolean),
          logWarnings: true,
          caller: 'recordCampaignProgress',
        },
      );
    });

    it('should check all passed cycles for campaign with > 1d duration when no intermediate results', async () => {
      const nFullCycles = faker.number.int({ min: 2, max: 5 });
      /**
       * Set campaign start date to be nFullCycles days and 1ms ago to make sure
       * that only full cycles are checked, and not including last partial cycle (if any)
       */
      campaign.startDate = dayjs()
        .subtract(nFullCycles, 'day')
        .subtract(1, 'ms')
        .toDate();
      /**
       * Campaign not ended yet to make sure endDate is last full cycle end
       */
      campaign.endDate = dayjs()
        .add(faker.number.int({ min: 1, max: 100 }), 'hour')
        .toDate();
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValue(
        generateCampaignProgress(campaign),
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(
        nFullCycles,
      );
      for (let i = 1; i <= nFullCycles; i += 1) {
        const expectedStartDate = dayjs(campaign.startDate)
          .add(i - 1, 'day')
          .toDate();

        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenNthCalledWith(
          i,
          campaign,
          expectedStartDate,
          dayjs(expectedStartDate).add(1, 'day').toDate(),
          {
            excludeIneligible: expect.any(Boolean),
            logWarnings: true,
            caller: 'recordCampaignProgress',
          },
        );
      }
    });

    it('should check last cycle if it is not round but campaign ended', async () => {
      const nFullCycles = faker.number.int({ min: 2, max: 5 });
      campaign.startDate = dayjs(campaign.endDate)
        .subtract(nFullCycles, 'day')
        .subtract(faker.number.int({ min: 1, max: 23 }), 'hour')
        .toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValue(
        generateCampaignProgress(campaign),
      );

      await campaignsService.recordCampaignProgress(campaign);

      const nTotalCycles = nFullCycles + 1;
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(
        nTotalCycles,
      );
      for (let i = 1; i <= nTotalCycles; i += 1) {
        const expectedStartDate = dayjs(campaign.startDate)
          .add(i - 1, 'day')
          .toDate();
        let expectedEndDate = dayjs(expectedStartDate).add(1, 'day').toDate();
        if (i === nTotalCycles) {
          expectedEndDate = campaign.endDate;
        }

        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenNthCalledWith(
          i,
          campaign,
          expectedStartDate,
          expectedEndDate,
          {
            excludeIneligible: expect.any(Boolean),
            logWarnings: true,
            caller: 'recordCampaignProgress',
          },
        );
      }
    });

    it('should not check progress if less than a day from last intermediate result for ongoing campaign', async () => {
      const now = Date.now();
      campaign.endDate = new Date(now + 1);
      campaign.startDate = dayjs(campaign.endDate).subtract(2, 'day').toDate();

      const intermediateResultsData = generateIntermediateResultsData({
        results: [
          generateIntermediateResult({
            endDate: dayjs(campaign.startDate).add(1, 'day').toDate(),
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

    it('should rely on last intermediate result when more than a day from last result and campaign not ended', async () => {
      campaign.endDate = dayjs().add(1, 'hour').toDate();
      campaign.startDate = dayjs(campaign.endDate).subtract(3, 'day').toDate();
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

      const expectedEndDate = dayjs(lastResultsEndDate).add(1, 'day').toDate();

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        lastResultsEndDate,
        expectedEndDate,
        {
          excludeIneligible: expect.any(Boolean),
          logWarnings: true,
          caller: 'recordCampaignProgress',
        },
      );
    });

    it('should rely on last intermediate result if less than a day from last result and campaign ended', async () => {
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

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(1);
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
        campaign,
        lastResultsEndDate,
        campaign.endDate,
        {
          excludeIneligible: expect.any(Boolean),
          logWarnings: true,
          caller: 'recordCampaignProgress',
        },
      );
    });

    it('should check all passed cycles for campaign with > 1d duration and existing intermediate results', async () => {
      const nFullCycles = faker.number.int({ min: 2, max: 5 });
      /**
       * Set campaign start date to be nFullCycles days and 1ms ago to make sure
       * that only full cycles are checked, and not including last partial cycle (if any)
       */
      campaign.startDate = dayjs()
        .subtract(nFullCycles, 'day')
        .subtract(1, 'ms')
        .toDate();
      /**
       * Campaign not ended yet to make sure endDate is last full cycle end
       */
      campaign.endDate = dayjs()
        .add(faker.number.int({ min: 1, max: 100 }), 'hour')
        .toDate();

      const lastResultsEndDate = dayjs(campaign.startDate)
        .add(1, 'day')
        .toDate();
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
      spyOnCheckCampaignProgressForPeriod.mockResolvedValue(
        generateCampaignProgress(campaign),
      );

      await campaignsService.recordCampaignProgress(campaign);

      /**
       * First is covered by intermediate result
       */
      const nNewCycles = nFullCycles - 1;
      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(
        nNewCycles,
      );
      for (let i = 1; i <= nNewCycles; i += 1) {
        const expectedStartDate = dayjs(lastResultsEndDate)
          .add(i - 1, 'day')
          .toDate();

        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenNthCalledWith(
          i,
          campaign,
          expectedStartDate,
          dayjs(expectedStartDate).add(1, 'day').toDate(),
          {
            excludeIneligible: expect.any(Boolean),
            logWarnings: true,
            caller: 'recordCampaignProgress',
          },
        );
      }
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
        {
          excludeIneligible: expect.any(Boolean),
          logWarnings: true,
          caller: 'recordCampaignProgress',
        },
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
        {
          excludeIneligible: expect.any(Boolean),
          logWarnings: true,
          caller: 'recordCampaignProgress',
        },
      );
    });

    it('should check all passed cycles for campaign with > 1d duration and cancellation request', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);
      const cancellationRequestedAt = new Date(campaign.endDate.valueOf() - 1);
      spyOnGetCancellationRequestDate.mockResolvedValueOnce(
        cancellationRequestedAt,
      );

      const nCycles = faker.number.int({ min: 2, max: 5 });
      campaign.startDate = dayjs(campaign.endDate)
        .subtract(nCycles, 'day')
        .toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValue(
        generateCampaignProgress(campaign),
      );

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledTimes(
        nCycles,
      );
      for (let i = 1; i <= nCycles; i += 1) {
        const expectedStartDate = dayjs(campaign.startDate)
          .add(i - 1, 'day')
          .toDate();
        let expectedEndDate = dayjs(expectedStartDate).add(1, 'day').toDate();
        if (i === nCycles) {
          expectedEndDate = cancellationRequestedAt;
        }

        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenNthCalledWith(
          i,
          campaign,
          expectedStartDate,
          expectedEndDate,
          {
            excludeIneligible: expect.any(Boolean),
            logWarnings: true,
            caller: 'recordCampaignProgress',
          },
        );
      }
    });

    it('should record campaign progress when no results yet', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        campaignProgress,
      );

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
              reserved_funds: expectedRewardPool,
              participants_outcomes_batches: [],
              ...campaignProgress.meta,
            },
          ],
        },
        ethers.parseUnits(expectedRewardPool, campaign.fundTokenDecimals),
      );
    });

    it('should record campaign progress to existing results', async () => {
      campaign.startDate = dayjs(campaign.endDate).subtract(2, 'day').toDate();

      const intermediateResultsData = generateIntermediateResultsData({
        results: [
          generateIntermediateResult({
            endDate: dayjs(campaign.startDate).add(1, 'day').toDate(),
          }),
        ],
      });

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
        intermediateResultsData,
      );

      const newCampaignProgress = generateCampaignProgress(campaign);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        newCampaignProgress,
      );

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        newCampaignProgress,
      );
      /**
       * Need to prepare it before calling recordCampaignProgress because it mutates
       * intermediateResultsData that is mocked as return value above
       */
      const expectedNewIntermediateResultsData = {
        ...intermediateResultsData,
        results: [
          ...intermediateResultsData.results,
          {
            from: newCampaignProgress.from,
            to: newCampaignProgress.to,
            reserved_funds: expectedRewardPool,
            participants_outcomes_batches: [],
            ...newCampaignProgress.meta,
          },
        ],
      };

      await campaignsService.recordCampaignProgress(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expectedNewIntermediateResultsData,
        ethers.parseUnits(expectedRewardPool, campaign.fundTokenDecimals),
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

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        campaignProgress,
      );

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
        ethers.parseUnits(expectedRewardPool, campaign.fundTokenDecimals),
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

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        campaignProgress,
      );

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
        ethers.parseUnits(expectedRewardPool, campaign.fundTokenDecimals),
      );
    });

    it('should record correctly calculated reserved funds for THRESHOLD campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.THRESHOLD);
      const campaignDetails = campaign.details as ThresholdCampaignDetails;

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const nEligible = faker.number.int({
        min: 1,
        max: campaignDetails.maxParticipants || 10,
      });
      const totalBalance = nEligible * campaignDetails.minimumBalanceTarget;

      const campaignProgress = generateCampaignProgress(campaign);
      (campaignProgress.meta as ThresholdMeta) = {
        total_score: nEligible,
        total_balance: totalBalance,
      };
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        campaignProgress,
      );

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            {
              from: campaignProgress.from,
              to: campaignProgress.to,
              total_balance: totalBalance,
              total_score: nEligible,
              reserved_funds: expectedRewardPool,
              participants_outcomes_batches: [],
            },
          ],
        }),
        ethers.parseUnits(expectedRewardPool, campaign.fundTokenDecimals),
      );
    });

    it('should record correctly calculated reserved funds for COMPETITIVE_MARKET_MAKING campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.COMPETITIVE_MARKET_MAKING);

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign);
      campaignProgress.participants_outcomes.push(
        generateParticipantOutcome(campaign.type, {
          total_volume: (
            campaign.details as CompetitiveMarketMakingCampaignDetails
          ).minVolumeRequired,
        }),
      );
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = rewardsUtils.calculateDailyReward(campaign);

      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledTimes(1);
      expect(spyOnRecordCampaignIntermediateResults).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            {
              from: campaignProgress.from,
              to: campaignProgress.to,
              total_volume: (campaignProgress.meta as MarketMakingMeta)
                .total_volume,
              reserved_funds: expectedRewardPool,
              participants_outcomes_batches: [
                {
                  id: expect.any(String),
                  results: campaignProgress.participants_outcomes,
                },
              ],
            },
          ],
        }),
        ethers.parseUnits(expectedRewardPool, campaign.fundTokenDecimals),
      );
    });

    it('should record participant results in batches', async () => {
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const participantOutcomes = [
        generateParticipantOutcome(campaign.type),
        generateParticipantOutcome(campaign.type),
        generateParticipantOutcome(campaign.type),
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

    it('should not move campaign to "pending_completion" when not all results calculated', async () => {
      const currentDate = new Date();
      campaign.endDate = new Date(currentDate.valueOf() + 1);

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
        resultsCutoffAt: dayjs(campaign.startDate).add(1, 'day').toDate(),
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
        resultsCutoffAt: campaign.endDate,
      });
    });

    it('should move campaign to "pending_completion" if recording period dates overlap', async () => {
      const escrowStatus = faker.helpers.arrayElement([
        EscrowStatus.Pending,
        EscrowStatus.Partial,
      ]);
      mockedGetEscrowStatus.mockResolvedValueOnce(escrowStatus);

      const currentDate = new Date();
      campaign.endDate = currentDate;
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
        resultsCutoffAt: campaign.endDate,
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
        resultsCutoffAt: cancellationRequestedAt,
      });
    });

    it('should move campaign to "pending_cancellation" when cancellation requested before campaign start', async () => {
      mockedGetEscrowStatus.mockResolvedValueOnce(EscrowStatus.ToCancel);
      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const cancellationRequestedAt = new Date(
        campaign.startDate.valueOf() - 1,
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
        resultsCutoffAt: cancellationRequestedAt,
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
        resultsCutoffAt: cancellationRequestedAt,
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

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        campaignProgress,
      );

      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledTimes(1);
      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledWith(campaign, {
        from: campaignProgress.from,
        to: campaignProgress.to,
        total_volume: 0,
        reserved_funds: expectedRewardPool,
        participants_outcomes_batches: [],
      });
    });

    it('should record generated volume stat for COMPETITIVE_MARKET_MAKING campaign', async () => {
      campaign = generateCampaignEntity(CampaignType.COMPETITIVE_MARKET_MAKING);
      campaign.endDate = dayjs(campaign.startDate).add(1, 'day').toDate();

      spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

      const campaignProgress = generateCampaignProgress(campaign);
      spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
        campaignProgress,
      );

      spyOnRecordCampaignIntermediateResults.mockResolvedValueOnce(
        generateStoredResultsMeta(),
      );

      await campaignsService.recordCampaignProgress(campaign);

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        campaignProgress,
      );

      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledTimes(1);
      expect(spyOnRecordGeneratedVolume).toHaveBeenCalledWith(campaign, {
        from: campaignProgress.from,
        to: campaignProgress.to,
        total_volume: 0,
        reserved_funds: expectedRewardPool,
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

    it('should log recording details', async () => {
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

      const expectedRewardPool = rewardsUtils.calculateRewardPool(
        campaign,
        campaignProgress,
      );

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        'Going to record campaign progress',
        {
          from: campaignProgress.from,
          to: campaignProgress.to,
          reserved_funds: expectedRewardPool,
        },
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        'Campaign progress recorded',
        {
          from: campaignProgress.from,
          to: campaignProgress.to,
          reserved_funds: expectedRewardPool,
          resultsUrl: storedResultsMeta.url,
          ...campaignProgress.meta,
        },
      );

      expect(logger.error).toHaveBeenCalledTimes(0);
    });

    describe('excludeIneligible flag', () => {
      it('should exclude ineligible participants for threshold with limit', async () => {
        campaign = generateCampaignEntity(CampaignType.THRESHOLD);
        (campaign.details as ThresholdCampaignDetails).maxParticipants =
          faker.number.int({ min: 1, max: 10 });

        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

        const campaignProgress = generateCampaignProgress(campaign);
        spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
          campaignProgress,
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
          campaign,
          expect.any(Date),
          expect.any(Date),
          expect.objectContaining({
            excludeIneligible: true,
          }),
        );
      });

      it('should not exclude ineligible participants for threshold without limit', async () => {
        campaign = generateCampaignEntity(CampaignType.THRESHOLD);
        delete (campaign.details as ThresholdCampaignDetails).maxParticipants;

        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

        const campaignProgress = generateCampaignProgress(campaign);
        spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
          campaignProgress,
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
          campaign,
          expect.any(Date),
          expect.any(Date),
          expect.objectContaining({
            excludeIneligible: false,
          }),
        );
      });

      it('should not exclude ineligible participants for non-threshold campaign', async () => {
        campaign = generateCampaignEntity(
          faker.helpers.arrayElement(
            Object.values(CampaignType).filter(
              (type) => type !== CampaignType.THRESHOLD,
            ),
          ),
        );

        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(null);

        const campaignProgress = generateCampaignProgress(campaign);
        spyOnCheckCampaignProgressForPeriod.mockResolvedValueOnce(
          campaignProgress,
        );

        await campaignsService.recordCampaignProgress(campaign);

        expect(spyOnCheckCampaignProgressForPeriod).toHaveBeenCalledWith(
          campaign,
          expect.any(Date),
          expect.any(Date),
          expect.objectContaining({
            excludeIneligible: false,
          }),
        );
      });
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

  describe('checkJoinStatus', () => {
    let userId: string;
    let chainId: number;
    let campaign: CampaignEntity;

    let spyOnCheckCampaignTargetMet: jest.SpyInstance;

    beforeAll(() => {
      spyOnCheckCampaignTargetMet = jest.spyOn(
        campaignsService,
        'checkCampaignTargetMet',
      );
      spyOnCheckCampaignTargetMet.mockImplementation();
    });

    beforeEach(() => {
      userId = faker.string.uuid();
      chainId = generateTestnetChainId();
      campaign = generateCampaignEntity();
    });

    afterAll(() => {
      spyOnCheckCampaignTargetMet.mockRestore();
    });

    it('should return "not_available" if campaign does not exist', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        null,
      );

      const result = await campaignsService.checkJoinStatus(
        userId,
        chainId,
        // not checksummed address
        campaign.address.toLowerCase(),
      );

      expect(result).toEqual({
        status: 'not_available',
      });

      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCampaignsRepository.findOneByChainIdAndAddress,
      ).toHaveBeenCalledWith(chainId, campaign.address);

      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it('should return "already_joined" and join date if user joined', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );

      const userJoinedAt = generateUserJoinedDate(campaign);
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        userJoinedAt,
      );

      const result = await campaignsService.checkJoinStatus(
        userId,
        chainId,
        campaign.address,
      );

      expect(result).toEqual({
        status: 'already_joined',
        joinedAt: userJoinedAt,
      });

      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it.each(
      Object.values(CampaignStatus).filter((s) => s !== CampaignStatus.ACTIVE),
    )(
      'should return "join_closed" if user not joined and campaign is not active: %s',
      async (campaignStatus) => {
        Object.assign(campaign, { status: campaignStatus });
        mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
          campaign,
        );
        mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
          null,
        );
        spyOnCheckCampaignTargetMet.mockResolvedValueOnce(true);

        const result = await campaignsService.checkJoinStatus(
          userId,
          chainId,
          campaign.address,
        );

        expect(result).toEqual({
          status: 'join_closed',
          reason: 'ended',
        });

        expect(
          mockParticipationsService.checkUserJoinedCampaign,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockParticipationsService.checkUserJoinedCampaign,
        ).toHaveBeenCalledWith(userId, campaign.id);
      },
    );

    it('should return "join_closed" if user not joined and campaign is ended', async () => {
      Object.assign(campaign, { endDate: new Date(Date.now() - 1) });

      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );
      spyOnCheckCampaignTargetMet.mockResolvedValueOnce(true);

      const result = await campaignsService.checkJoinStatus(
        userId,
        chainId,
        campaign.address,
      );

      expect(result).toEqual({
        status: 'join_closed',
        reason: 'ended',
      });

      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it('should return "max_participants_reached" if user not joined and participant limit reached', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );
      mockParticipationsService.checkParticipantLimitReached.mockResolvedValueOnce(
        true,
      );

      const result = await campaignsService.checkJoinStatus(
        userId,
        chainId,
        campaign.address,
      );

      expect(result).toEqual({
        status: 'join_closed',
        reason: 'max_participants_reached',
      });

      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it('should return "join_closed" if user not joined and ongoing campaign target is met', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );
      mockParticipationsService.checkParticipantLimitReached.mockResolvedValueOnce(
        false,
      );
      spyOnCheckCampaignTargetMet.mockResolvedValueOnce(true);

      const result = await campaignsService.checkJoinStatus(
        userId,
        chainId,
        campaign.address,
      );

      expect(result).toEqual({
        status: 'join_closed',
        reason: 'target_met',
      });

      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it('should return "can_join" if user not joined and ongoing campaign target is not met', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );
      mockParticipationsService.checkParticipantLimitReached.mockResolvedValueOnce(
        false,
      );
      spyOnCheckCampaignTargetMet.mockResolvedValueOnce(false);

      const result = await campaignsService.checkJoinStatus(
        userId,
        chainId,
        campaign.address,
      );

      expect(result).toEqual({
        status: 'can_join',
      });

      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsService.checkUserJoinedCampaign,
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
      campaign.exchangeName = faker.lorem.slug(); // any exchange w/o specific logic
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

    it('should return correct timeframe when cancellation requested within that', async () => {
      campaign.status = CampaignStatus.TO_CANCEL;

      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const expectedTimeframeStart = dayjs(campaign.startDate)
        .add(campaignDaysPassed, 'days')
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

    it('should return correct timeframe for active campaign', async () => {
      campaign.exchangeName = faker.lorem.slug(); // any exchange w/o specific logic

      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const expectedTimeframeStart = dayjs(campaign.startDate)
        .add(campaignDaysPassed, 'days')
        .toDate();

      const result = await campaignsService.getActiveTimeframe(campaign);

      expect(result).toEqual({
        start: expectedTimeframeStart,
        end: mockedNow,
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

    it('should return correct timeframe for active pancakeswap campaign', async () => {
      campaign.exchangeName = ExchangeName.PANCAKESWAP;

      mockExchangeApiClientFactory.createDex.mockReturnValueOnce(
        mockedPancakeswapClient,
      );
      const mockedLastBlockTs = Math.round(
        faker.date.recent().valueOf() / 1000,
      );
      mockedPancakeswapClient.fetchSubgraphMeta.mockResolvedValueOnce({
        block: {
          timestamp: mockedLastBlockTs,
          hash: faker.string.hexadecimal(),
          number: faker.number.int(),
        },
        hasIndexingErrors: false,
      });

      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const expectedTimeframeStart = dayjs(campaign.startDate)
        .add(campaignDaysPassed, 'days')
        .toDate();

      const result = await campaignsService.getActiveTimeframe(campaign);

      expect(result).toEqual({
        start: expectedTimeframeStart,
        end: new Date(mockedLastBlockTs * 1000),
      });

      expect(mockExchangeApiClientFactory.createDex).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiClientFactory.createDex).toHaveBeenCalledWith(
        ExchangeName.PANCAKESWAP,
        {
          userId: 'system',
          userEvmAddress: 'n/a',
        },
      );
    });

    it('should return correct timeframe when cancellation requested for pancakeswap campaign', async () => {
      campaign.status = CampaignStatus.TO_CANCEL;
      campaign.exchangeName = ExchangeName.PANCAKESWAP;

      mockExchangeApiClientFactory.createDex.mockReturnValueOnce(
        mockedPancakeswapClient,
      );
      const mockedLastBlockTs = Math.round(
        faker.date.recent().valueOf() / 1000,
      );
      mockedPancakeswapClient.fetchSubgraphMeta.mockResolvedValueOnce({
        block: {
          timestamp: mockedLastBlockTs,
          hash: faker.string.hexadecimal(),
          number: faker.number.int(),
        },
        hasIndexingErrors: false,
      });

      const campaignDaysPassed = faker.number.int({ min: 1, max: 3 });
      campaign.startDate = dayjs()
        .subtract(campaignDaysPassed, 'days')
        .toDate();

      const expectedTimeframeStart = dayjs(campaign.startDate)
        .add(campaignDaysPassed, 'days')
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
        end: new Date(mockedLastBlockTs * 1000),
      });

      expect(mockExchangeApiClientFactory.createDex).toHaveBeenCalledTimes(1);
      expect(mockExchangeApiClientFactory.createDex).toHaveBeenCalledWith(
        ExchangeName.PANCAKESWAP,
        {
          userId: 'system',
          userEvmAddress: 'n/a',
        },
      );
    });
  });

  describe('refreshInterimProgressCache', () => {
    let spyOnCheckCampaignProgressForPeriod: jest.SpyInstance;
    let spyOnGetActiveTimeframe: jest.SpyInstance;

    beforeAll(() => {
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
      spyOnCheckCampaignProgressForPeriod.mockRestore();
      spyOnGetActiveTimeframe.mockRestore();
    });

    beforeEach(() => {
      mockPgAdvisoryLock.withLock.mockImplementationOnce(async (_key, fn) => {
        await fn();
      });
    });

    afterEach(() => {
      mockCacheManager.clear();
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
          {
            caller: 'refreshInterimProgressCache',
          },
        );
        await expect(
          campaignsCache.getInterimProgress(campaign.id),
        ).resolves.toEqual(campaignsProgressMap.get(campaign.id));
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
      await expect(
        campaignsCache.getInterimProgress(campaign.id),
      ).resolves.toBeNull();
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
      await expect(
        campaignsCache.getInterimProgress(campaign.id),
      ).resolves.toBeNull();
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

      await expect(
        campaignsCache.getInterimProgress(okCampaign.id),
      ).resolves.not.toBeNull();
      await expect(
        campaignsCache.getInterimProgress(errorCampaign.id),
      ).resolves.toBeNull();

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
    let spyOnGetActiveTimeframe: jest.SpyInstance;

    let userId: string;
    let evmAddress: string;
    let chainId: number;
    let campaign: CampaignEntity;

    beforeAll(() => {
      userId = faker.string.uuid();
      evmAddress = faker.finance.ethereumAddress();
      chainId = generateTestnetChainId();

      spyOnGetActiveTimeframe = jest.spyOn(
        campaignsService,
        'getActiveTimeframe',
      );
      spyOnGetActiveTimeframe.mockImplementation();
    });

    afterAll(() => {
      spyOnGetActiveTimeframe.mockRestore();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();

      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );
    });

    afterEach(() => {
      mockCacheManager.clear();
    });

    it('should throw when campaign not found', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress
        .mockReset()
        .mockResolvedValueOnce(null);

      let thrownError: any;
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
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it('should throw when campaign not started yet', async () => {
      jest.useFakeTimers({
        now: dayjs(campaign.startDate).subtract(1, 'millisecond').toDate(),
      });

      let thrownError: any;
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
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it('should throw when campaign already finished', async () => {
      jest.useFakeTimers({
        now: new Date(campaign.endDate.valueOf() + 1),
      });

      let thrownError: any;
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
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(0);
    });

    it.each([
      CampaignStatus.CANCELLED,
      CampaignStatus.PENDING_CANCELLATION,
      CampaignStatus.COMPLETED,
    ])(
      'should throw when campaign status is not eligible for progress check: "%s"',
      async (campaignStatus) => {
        campaign.status = campaignStatus;

        let thrownError: any;
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
          mockParticipationsService.checkUserJoinedCampaign,
        ).toHaveBeenCalledTimes(0);
      },
    );

    it('should throw when user not joined', async () => {
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        null,
      );

      let thrownError: any;
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

      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsService.checkUserJoinedCampaign,
      ).toHaveBeenCalledWith(userId, campaign.id);
    });

    it("should throw when can't get active timeframe", async () => {
      spyOnGetActiveTimeframe.mockReturnValueOnce(null);

      let thrownError: any;
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
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        generateUserJoinedDate(campaign),
      );

      const participantMetaProp = faker.lorem.word();
      const participantMetaValue = faker.number.float();
      const participantOutcome = generateParticipantOutcome(campaign.type, {
        address: evmAddress,
        [participantMetaProp]: participantMetaValue,
        total_volume: undefined,
        token_balance: undefined,
      });

      const mockedActiveTimeframe = {
        start: faker.date.recent(),
        end: faker.date.recent(),
      };
      spyOnGetActiveTimeframe.mockResolvedValueOnce(mockedActiveTimeframe);

      const campaignProgress: CampaignProgress<CampaignProgressMeta> = {
        from: mockedActiveTimeframe.start.toISOString(),
        to: mockedActiveTimeframe.end.toISOString(),
        participants_outcomes: [
          generateParticipantOutcome(campaign.type),
          participantOutcome,
          generateParticipantOutcome(campaign.type),
        ],
        meta: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          anything: faker.number.float(),
        },
      };
      await campaignsCache.setInterimProgress(
        campaign.id,
        campaignProgress,
        mockedActiveTimeframe.end,
      );

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
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        generateUserJoinedDate(campaign),
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
      mockParticipationsService.checkUserJoinedCampaign.mockResolvedValueOnce(
        generateUserJoinedDate(campaign),
      );

      const mockedActiveTimeframe = {
        start: faker.date.recent(),
        end: faker.date.soon(),
      };
      spyOnGetActiveTimeframe.mockResolvedValueOnce(mockedActiveTimeframe);

      const campaignProgress = generateCampaignProgress(campaign);
      campaignProgress.to = new Date(
        mockedActiveTimeframe.start.valueOf() - 1,
      ).toISOString();
      campaignProgress.from = faker.date
        .recent({
          refDate: campaignProgress.to,
        })
        .toISOString();

      await campaignsCache.setInterimProgress(
        campaign.id,
        campaignProgress,
        mockedActiveTimeframe.end,
      );

      const progress = await campaignsService.getUserProgress(
        userId,
        evmAddress,
        chainId,
        campaign.address,
      );

      expect(progress).toBeNull();
    });
  });

  describe('discoverNewCampaigns', () => {
    const originalSupportedChainIds = mockWeb3Service.supportedChainIds;
    const supportedChainId = faker.number.int();

    let spyOnRetrieveCampaignData: jest.SpyInstance;
    let spyOnCreateCampaign: jest.SpyInstance;
    let spyOnGetChainDiscoveryAnchor: jest.SpyInstance;
    let spyOnSetChainDiscoveryAnchor: jest.SpyInstance;

    beforeAll(() => {
      spyOnRetrieveCampaignData = jest.spyOn(
        campaignsService,
        'retrieveCampaignData' as any,
      );
      spyOnRetrieveCampaignData.mockImplementation();

      spyOnCreateCampaign = jest.spyOn(campaignsService, 'createCampaign');
      spyOnCreateCampaign.mockImplementation();

      spyOnGetChainDiscoveryAnchor = jest.spyOn(
        campaignsCache,
        'getChainDiscoveryAnchor',
      );
      spyOnGetChainDiscoveryAnchor.mockImplementation();

      spyOnSetChainDiscoveryAnchor = jest.spyOn(
        campaignsCache,
        'setChainDiscoveryAnchor',
      );
      spyOnSetChainDiscoveryAnchor.mockImplementation();
    });

    beforeEach(() => {
      (mockWeb3Service.supportedChainIds as any) = [supportedChainId];
    });

    afterAll(() => {
      (mockWeb3Service.supportedChainIds as any) = originalSupportedChainIds;

      spyOnRetrieveCampaignData.mockRestore();
      spyOnCreateCampaign.mockRestore();
      spyOnGetChainDiscoveryAnchor.mockRestore();
      spyOnSetChainDiscoveryAnchor.mockRestore();
    });

    it('should run discovery for each supported chain', async () => {
      (mockWeb3Service.supportedChainIds as any) = [
        faker.number.int(),
        faker.number.int(),
      ];

      await campaignsService.discoverNewCampaigns();

      expect(spyOnGetChainDiscoveryAnchor).toHaveBeenCalledTimes(
        mockWeb3Service.supportedChainIds.length,
      );
      for (const chainId of mockWeb3Service.supportedChainIds) {
        expect(spyOnGetChainDiscoveryAnchor).toHaveBeenCalledWith(chainId);
      }
    });

    it('should use discovery anchor for lookback', async () => {
      const chainDiscoveryAnchor = faker.date.past();
      spyOnGetChainDiscoveryAnchor.mockResolvedValue(chainDiscoveryAnchor);

      await campaignsService.discoverNewCampaigns();

      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledTimes(1);
      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledWith({
        chainId: supportedChainId,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
        status: [EscrowStatus.Pending, EscrowStatus.ToCancel],
        from: chainDiscoveryAnchor,
        orderDirection: OrderDirection.ASC,
        first: 50,
      });
    });

    it('should use default "from" if no latest campaign', async () => {
      await campaignsService.discoverNewCampaigns();

      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledTimes(1);
      expect(mockedEscrowUtils.getEscrows).toHaveBeenCalledWith({
        chainId: supportedChainId,
        recordingOracle: mockWeb3ConfigService.operatorAddress,
        status: [EscrowStatus.Pending, EscrowStatus.ToCancel],
        from: undefined,
        orderDirection: OrderDirection.ASC,
        first: 50,
      });
    });

    it('should not save discovered campaign if it already exists', async () => {
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(true);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
        createdAt: faker.date.recent().valueOf(),
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

      expect(logger.debug).toHaveBeenCalledTimes(3);
      expect(logger.debug).toHaveBeenNthCalledWith(
        2,
        'Discovered campaign already exists; skip it',
        {
          chainId: supportedChainId,
          campaignAddress,
        },
      );

      expect(spyOnSetChainDiscoveryAnchor).toHaveBeenCalledTimes(1);
      expect(spyOnSetChainDiscoveryAnchor).toHaveBeenCalledWith(
        supportedChainId,
        new Date(escrow.createdAt),
      );
    });

    it('should save discovered campaign if not already exist', async () => {
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(false);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
        createdAt: faker.date.recent().valueOf(),
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

      expect(spyOnSetChainDiscoveryAnchor).toHaveBeenCalledTimes(1);
      expect(spyOnSetChainDiscoveryAnchor).toHaveBeenCalledWith(
        supportedChainId,
        new Date(escrow.createdAt),
      );
    });

    it('should not save and skip discovered campaign if invalid', async () => {
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(false);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
        createdAt: faker.date.recent().valueOf(),
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

      expect(spyOnSetChainDiscoveryAnchor).toHaveBeenCalledTimes(1);
      expect(spyOnSetChainDiscoveryAnchor).toHaveBeenCalledWith(
        supportedChainId,
        new Date(escrow.createdAt),
      );

      expect(logger.error).toHaveBeenCalledTimes(0);
    });

    it('should rethrow and stop discovery if fails to retrieve some campaign', async () => {
      mockCampaignsRepository.checkCampaignExists.mockResolvedValueOnce(false);

      const campaignAddress = ethers.getAddress(
        faker.finance.ethereumAddress(),
      );
      const escrow = {
        address: campaignAddress.toLowerCase(),
        createdAt: faker.date.recent().valueOf(),
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

      expect(spyOnSetChainDiscoveryAnchor).toHaveBeenCalledTimes(0);

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
      mockCampaignsRepository.checkCampaignExists.mockResolvedValue(true);

      const escrows = Array.from(
        { length: faker.number.int({ min: 2, max: 4 }) },
        () => ({
          address: faker.finance.ethereumAddress(),
          createdAt: faker.date.recent().valueOf(),
        }),
      );
      mockedEscrowUtils.getEscrows.mockResolvedValueOnce(escrows as IEscrow[]);

      await campaignsService.discoverNewCampaigns();

      expect(mockCampaignsRepository.checkCampaignExists).toHaveBeenCalledTimes(
        escrows.length,
      );
    });
  });

  describe('getCampaignLeaderboard', () => {
    let spyOnRetrieveCampaignIntermediateResults: jest.SpyInstance;
    let campaign: CampaignEntity;
    let now: Date;
    let outcomeToEntryResultProp: string;

    beforeAll(() => {
      now = new Date();
      jest.useFakeTimers({ now });

      spyOnRetrieveCampaignIntermediateResults = jest.spyOn(
        campaignsService as any,
        'retrieveCampaignIntermediateResults',
      );
      spyOnRetrieveCampaignIntermediateResults.mockImplementation();
    });

    beforeEach(() => {
      campaign = generateCampaignEntity();
      campaign.resultsCutoffAt = faker.date.recent();
      mockCampaignsRepository.findOneByChainIdAndAddress.mockResolvedValueOnce(
        campaign,
      );

      if (
        [
          CampaignType.MARKET_MAKING,
          CampaignType.COMPETITIVE_MARKET_MAKING,
        ].includes(campaign.type)
      ) {
        outcomeToEntryResultProp = 'total_volume';
      } else if (
        [CampaignType.HOLDING, CampaignType.THRESHOLD].includes(campaign.type)
      ) {
        outcomeToEntryResultProp = 'token_balance';
      } else {
        outcomeToEntryResultProp = 'unknown';
      }
    });

    afterEach(() => {
      campaignsService['prefinalResultsCache'].clear();
      mockCacheManager.clear();
    });

    afterAll(() => {
      jest.useRealTimers();
      spyOnRetrieveCampaignIntermediateResults.mockRestore();
    });

    it('should return empty data if campaign not found', async () => {
      mockCampaignsRepository.findOneByChainIdAndAddress
        .mockReset()
        .mockResolvedValueOnce(null);

      const data = await campaignsService.getCampaignLeaderboard(
        campaign.chainId,
        campaign.address,
      );

      expect(data).toEqual({
        updatedAt: now,
        total: 0,
        entries: [],
      });
    });

    it.each([CampaignStatus.CANCELLED, CampaignStatus.COMPLETED])(
      'should throw when campaign already finished w/ "%s" status',
      async (campaignStatus) => {
        campaign.status = campaignStatus;

        let thrownError: any;
        try {
          await campaignsService.getCampaignLeaderboard(
            campaign.chainId,
            campaign.address,
          );
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(CampaignAlreadyFinishedError);
        expect(thrownError.chainId).toBe(campaign.chainId);
        expect(thrownError.address).toBe(campaign.address);
      },
    );

    it.each([
      CampaignStatus.PENDING_CANCELLATION,
      CampaignStatus.PENDING_COMPLETION,
    ])(
      'should return data based on intermediate results for "%s" campaign',
      async (campaignStatus) => {
        campaign.status = campaignStatus;

        const intermediateResultsData = generateIntermediateResultsData();
        const participantOutcomes = Array.from({ length: 3 }, () =>
          generateParticipantOutcome(campaign.type),
        );
        intermediateResultsData.results[0].participants_outcomes_batches.push({
          id: faker.string.uuid(),
          results: participantOutcomes,
        });
        spyOnRetrieveCampaignIntermediateResults.mockResolvedValueOnce(
          intermediateResultsData,
        );

        const data = await campaignsService.getCampaignLeaderboard(
          campaign.chainId,
          campaign.address,
        );

        const rewardPool = intermediateResultsData.results[0].reserved_funds;
        const estimatedRewards = isCompetitiveMarketMakingCampaign(campaign)
          ? rewardsUtils.estimateCompetitiveRewards(
              participantOutcomes,
              rewardPool,
              campaign,
            )
          : rewardsUtils.estimateRewards(participantOutcomes, rewardPool);

        let expectedTotal = 0;
        const expectedEntries = _.orderBy(
          participantOutcomes.map((outcome) => {
            // prettier-ignore
            const result = (outcome[outcomeToEntryResultProp]) as number;

            expectedTotal += result;

            return {
              address: outcome.address,
              score: outcome.score,
              result: result,
              estimatedReward: estimatedRewards[outcome.address],
            };
          }),
          'score',
          'desc',
        );
        expect(data).toEqual({
          entries: expectedEntries,
          total: expectedTotal,
          updatedAt: new Date(intermediateResultsData.results[0].to),
        });
      },
    );

    it.each([CampaignStatus.ACTIVE, CampaignStatus.TO_CANCEL])(
      'should return data based on interim cache for "%s" campaign',
      async (campaignStatus) => {
        campaign.status = campaignStatus;

        const participantOutcomes = Array.from({ length: 3 }, () =>
          generateParticipantOutcome(campaign.type),
        );
        const cacheCycleTo = faker.date.recent();
        /**
         * Put random meta to cover all campaign types
         * just to verify estimated rewards
         */
        const interimMeta: MarketMakingMeta & HoldingMeta & ThresholdMeta = {
          total_volume: faker.number.float({ min: 1, max: 1000 }),
          total_balance: faker.number.float({ min: 1, max: 1000 }),
          total_score: faker.number.float({
            min: 1,
            max: isThresholdCampaign(campaign)
              ? campaign.details.maxParticipants
              : 10,
          }),
        };
        const interimProgress: CampaignProgress<CampaignProgressMeta> = {
          from: dayjs(cacheCycleTo).subtract(1, 'day').toISOString(),
          to: cacheCycleTo.toISOString(),
          participants_outcomes: participantOutcomes,
          meta: interimMeta,
        };
        await campaignsCache.setInterimProgress(
          campaign.id,
          interimProgress,
          faker.date.future(),
        );

        const data = await campaignsService.getCampaignLeaderboard(
          campaign.chainId,
          campaign.address,
        );

        const rewardPool = rewardsUtils.calculateRewardPool(
          campaign,
          interimProgress,
        );
        const estimatedRewards = isCompetitiveMarketMakingCampaign(campaign)
          ? rewardsUtils.estimateCompetitiveRewards(
              participantOutcomes,
              rewardPool,
              campaign,
            )
          : rewardsUtils.estimateRewards(participantOutcomes, rewardPool);
        let expectedTotal = 0;

        const expectedEntries = _.orderBy(
          participantOutcomes.map((outcome) => {
            // prettier-ignore
            const result = (outcome[outcomeToEntryResultProp]) as number;

            expectedTotal += result;

            return {
              address: outcome.address,
              score: outcome.score,
              result: result,
              estimatedReward: estimatedRewards[outcome.address],
            };
          }),
          'score',
          'desc',
        );
        expect(data).toEqual({
          entries: expectedEntries,
          total: expectedTotal,
          updatedAt: cacheCycleTo,
        });
      },
    );

    it.each([CampaignStatus.ACTIVE, CampaignStatus.TO_CANCEL])(
      'should handle empty interim cache for "%s" campaign',
      async (campaignStatus) => {
        campaign.status = campaignStatus;

        const data = await campaignsService.getCampaignLeaderboard(
          campaign.chainId,
          campaign.address,
        );

        expect(data).toEqual({
          updatedAt: now,
          total: 0,
          entries: [],
        });
      },
    );
  });
});
