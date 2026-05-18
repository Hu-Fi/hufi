import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { Test } from '@nestjs/testing';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

import { CampaignType } from '@/common/constants';
import logger from '@/logger';
import {
  ExchangesService,
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
} from '@/modules/exchanges';
import { UserPreferencesRepository } from '@/modules/users';
import { generateUserEntity } from '@/modules/users/fixtures';

import { AutojoinService } from './autojoin.service';
import { CampaignEntity } from './campaign.entity';
import { CAMPAIGN_PERMISSIONS_MAP } from './constants';
import { generateCampaignEntity } from './fixtures';
import { ParticipationsService } from './participations';
import { CampaignStatus } from './types';

vi.mock('@/logger');

const mockExchangesService = createMock<ExchangesService>();
const mockParticipationsService = createMock<ParticipationsService>();
const mockUserPreferencesRepository = createMock<UserPreferencesRepository>();

describe('UserPreferencesService', () => {
  let autojoinService: AutojoinService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AutojoinService,
        {
          provide: ExchangesService,
          useValue: mockExchangesService,
        },
        {
          provide: ParticipationsService,
          useValue: mockParticipationsService,
        },
        {
          provide: UserPreferencesRepository,
          useValue: mockUserPreferencesRepository,
        },
      ],
    }).compile();

    autojoinService = moduleRef.get<AutojoinService>(AutojoinService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('should be defined', () => {
    expect(autojoinService).toBeDefined();
  });

  describe('handleCampaignCreated', () => {
    let campaign: CampaignEntity;
    let expectedAutojoinToken: string;

    beforeEach(() => {
      campaign = generateCampaignEntity(
        faker.helpers.arrayElement([
          CampaignType.MARKET_MAKING,
          CampaignType.HOLDING,
        ]),
      );

      expectedAutojoinToken =
        campaign.type === CampaignType.MARKET_MAKING
          ? campaign.symbol.split('/')[0]
          : campaign.symbol;
    });

    test('should init correct child logger', async () => {
      const spyOnLoggerChild = vi.spyOn(logger, 'child');

      try {
        await autojoinService.handleCampaignCreated(campaign);

        expect(logger.child).toHaveBeenCalledTimes(1);
        expect(logger.child).toHaveBeenCalledWith({
          campaignId: campaign.id,
          chaindId: campaign.chainId,
          address: campaign.address,
        });
      } finally {
        spyOnLoggerChild.mockRestore();
      }
    });

    describe('skipping non-eligible campaigns', () => {
      function expectCampaignSkipping() {
        expect(
          mockUserPreferencesRepository.findForAutojoin,
        ).toHaveBeenCalledTimes(0);
        expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(0);

        expect(logger.info).toHaveBeenCalledWith(
          'Campaign is not eligible for autojoin, skipping',
          {
            type: campaign.type,
            status: campaign.status,
            endDate: campaign.endDate,
          },
        );
      }

      test.each(
        Object.values(CampaignStatus).filter(
          (status) => status !== CampaignStatus.ACTIVE,
        ),
      )("should skip if campaign is '%s'", async (campaignStatus) => {
        campaign.status = campaignStatus;

        await autojoinService.handleCampaignCreated(campaign);

        expectCampaignSkipping();
      });

      test('should skip if campaign end date reached', async () => {
        campaign.endDate = faker.date.recent();

        await autojoinService.handleCampaignCreated(campaign);

        expectCampaignSkipping();
      });

      test.each([
        CampaignType.COMPETITIVE_MARKET_MAKING,
        CampaignType.THRESHOLD,
        'unknown_type',
      ])(
        "should skip if campaign type is not eligible: '%s'",
        async (campaignType) => {
          campaign.type = campaignType as CampaignType;

          await autojoinService.handleCampaignCreated(campaign);

          expectCampaignSkipping();
        },
      );
    });

    test('should handle processing errors', async () => {
      const syntheticError = new Error(faker.lorem.sentence());
      mockUserPreferencesRepository.findForAutojoin.mockRejectedValueOnce(
        syntheticError,
      );

      await autojoinService.handleCampaignCreated(campaign);

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        'Started autojoin process for campaign',
        {
          autojoinToken: expectedAutojoinToken,
        },
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        'Finished autojoin process for campaign',
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error during autojoin process for campaign',
        expect.objectContaining({
          error: syntheticError,
        }),
      );
    });

    test('should autojoin eligible users to campaign', async () => {
      const autojoinCandidates = [generateUserEntity(), generateUserEntity()];
      mockUserPreferencesRepository.findForAutojoin.mockResolvedValueOnce(
        autojoinCandidates,
      );

      await autojoinService.handleCampaignCreated(campaign);

      expect(
        mockUserPreferencesRepository.findForAutojoin,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockUserPreferencesRepository.findForAutojoin,
      ).toHaveBeenCalledWith({
        exchange: campaign.exchangeName,
        campaignType: campaign.type,
        token: expectedAutojoinToken,
      });

      expect(
        mockExchangesService.assertUserHasRequiredAccess,
      ).toHaveBeenCalledTimes(autojoinCandidates.length);
      expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(
        autojoinCandidates.length,
      );
      for (const candidate of autojoinCandidates) {
        expect(
          mockExchangesService.assertUserHasRequiredAccess,
        ).toHaveBeenCalledWith(
          candidate.id,
          campaign.exchangeName,
          CAMPAIGN_PERMISSIONS_MAP[campaign.type],
        );
        expect(mockParticipationsService.joinCampaign).toHaveBeenCalledWith(
          candidate.id,
          campaign,
        );
      }
    });

    describe('handling exchange API auth errors', () => {
      function expectExchangeAuthErrorHandling(userId: string, error: Error) {
        expect(mockParticipationsService.joinCampaign).toHaveBeenCalledTimes(0);
        expect(logger.error).toHaveBeenCalledTimes(0);

        expect(logger.debug).toHaveBeenCalledWith(
          'Failed to join user due to exchange access',
          {
            userId,
            error,
          },
        );
        expect(
          mockUserPreferencesRepository.removeExchangeFromAutojoin,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockUserPreferencesRepository.removeExchangeFromAutojoin,
        ).toHaveBeenCalledWith(userId, campaign.exchangeName);
      }

      test('should handle ExchangeApiKeyNotFoundError', async () => {
        const autojoinCandidate = generateUserEntity();
        mockUserPreferencesRepository.findForAutojoin.mockResolvedValueOnce([
          autojoinCandidate,
        ]);

        const syntheticError = new ExchangeApiKeyNotFoundError(
          autojoinCandidate.id,
          campaign.exchangeName,
        );
        mockExchangesService.assertUserHasRequiredAccess.mockRejectedValueOnce(
          syntheticError,
        );

        await autojoinService.handleCampaignCreated(campaign);

        expectExchangeAuthErrorHandling(autojoinCandidate.id, syntheticError);
      });

      test('should handle KeyAuthorizationError', async () => {
        const autojoinCandidate = generateUserEntity();
        mockUserPreferencesRepository.findForAutojoin.mockResolvedValueOnce([
          autojoinCandidate,
        ]);

        const syntheticError = new KeyAuthorizationError(
          campaign.exchangeName,
          [],
        );
        mockExchangesService.assertUserHasRequiredAccess.mockRejectedValueOnce(
          syntheticError,
        );

        await autojoinService.handleCampaignCreated(campaign);

        expectExchangeAuthErrorHandling(autojoinCandidate.id, syntheticError);
      });
    });
  });
});
