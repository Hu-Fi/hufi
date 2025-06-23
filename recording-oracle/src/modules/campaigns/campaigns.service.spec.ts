/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('@human-protocol/sdk');
jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient, EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { ExchangeApiKeysRepository } from '@/modules/exchange-api-keys';
import { Web3Service } from '@/modules/web3';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '@/modules/web3/fixtures';
import * as manifestUtils from '@/utils/manifest';

import { CampaignNotFoundError, InvalidCampaign } from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { generateCampaignManifest } from './fixtures';

const mockCampaignsRepository = createMock<CampaignsRepository>();
const mockUserCampaignsRepository = createMock<UserCampaignsRepository>();
const mockExchangeApiKeysRepository = createMock<ExchangeApiKeysRepository>();

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
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        Web3Service,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        manifestUrl,
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
      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledWith(manifestUrl);
    });

    it('should download and return manifest', async () => {
      const manifestUrl = faker.internet.url();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        manifestUrl,
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
      expect(spyOnDownloadCampaignManifest).toHaveBeenCalledWith(manifestUrl);
    });
  });
});
