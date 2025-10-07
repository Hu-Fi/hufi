/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('@human-protocol/sdk');
jest.mock('@/logger');

import crypto from 'crypto';

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';

import { ContentType } from '@/common/enums';
import { Web3ConfigService } from '@/config';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '@/modules/web3/fixtures';

import {
  generateCampaign,
  generateEscrow,
  generateIntermediateResultsData,
} from './fixtures';
import { PayoutsService } from './payouts.service';
import { CampaignWithResults } from './types';

const mockStorageService = createMock<StorageService>();
const mockWeb3Service = createMock<Web3Service>();

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
});
