import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { createDuplicatedKeyError } from '~/test/fixtures/database';

import type { CampaignEntity } from '../campaign.entity';
import { generateCampaignEntity } from '../fixtures';
import { UserAlreadyJoinedError } from './participations.errors';
import { ParticipationsRepository } from './participations.repository';
import { ParticipationsService } from './participations.service';
import { isThresholdCampaign } from '../type-guards';
import { CampaignType, ThresholdCampaignDetails } from '../types';

const mockParticipationsRepository = createMock<ParticipationsRepository>();

describe('ParticipationsService', () => {
  let participationsService: ParticipationsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ParticipationsService,
        {
          provide: ParticipationsRepository,
          useValue: mockParticipationsRepository,
        },
      ],
    }).compile();

    participationsService = moduleRef.get<ParticipationsService>(
      ParticipationsService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(participationsService).toBeDefined();
  });

  describe('joinCampaign', () => {
    const testFakeDate = new Date();

    let userId: string;
    let campaign: CampaignEntity;
    let expectedParticipantsLimit: number | undefined;

    beforeAll(() => {
      jest.useFakeTimers({ now: testFakeDate });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    beforeEach(() => {
      userId = faker.string.uuid();
      campaign = generateCampaignEntity();
      expectedParticipantsLimit = isThresholdCampaign(campaign)
        ? campaign.details.maxParticipants
        : undefined;
    });

    it('should join user to campaign if no race condition', async () => {
      mockParticipationsRepository.safeInsert.mockResolvedValueOnce(undefined);

      await expect(
        participationsService.joinCampaign(userId, campaign),
      ).resolves.toBeUndefined();

      expect(mockParticipationsRepository.safeInsert).toHaveBeenCalledTimes(1);
      expect(mockParticipationsRepository.safeInsert).toHaveBeenCalledWith(
        {
          userId,
          campaignId: campaign.id,
          createdAt: testFakeDate,
        },
        expectedParticipantsLimit,
      );
    });

    it('should throw error if already joined', async () => {
      mockParticipationsRepository.safeInsert.mockRejectedValueOnce(
        createDuplicatedKeyError(),
      );

      let thrownError;
      try {
        await participationsService.joinCampaign(userId, campaign);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(UserAlreadyJoinedError);
      expect(thrownError.campaignId).toBe(campaign.id);
      expect(thrownError.userId).toBe(userId);

      expect(mockParticipationsRepository.safeInsert).toHaveBeenCalledTimes(1);
      expect(mockParticipationsRepository.safeInsert).toHaveBeenCalledWith(
        {
          userId,
          campaignId: campaign.id,
          createdAt: testFakeDate,
        },
        expectedParticipantsLimit,
      );
    });

    it('should re-throw unexpected errors', async () => {
      const syntheticError = new Error(faker.lorem.sentence());

      mockParticipationsRepository.safeInsert.mockRejectedValueOnce(
        syntheticError,
      );

      await expect(
        participationsService.joinCampaign(userId, campaign),
      ).rejects.toThrow(syntheticError);
    });
  });

  describe('checkUserJoinedCampaign', () => {
    let userId: string;
    let campaignId: string;

    beforeEach(() => {
      userId = faker.string.uuid();
      campaignId = faker.string.uuid();
    });

    it('should return null if not joined', async () => {
      mockParticipationsRepository.findByUserAndCampaign.mockResolvedValueOnce(
        null,
      );

      await expect(
        participationsService.checkUserJoinedCampaign(userId, campaignId),
      ).resolves.toBeNull();

      expect(
        mockParticipationsRepository.findByUserAndCampaign,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsRepository.findByUserAndCampaign,
      ).toHaveBeenCalledWith(userId, campaignId);
    });

    it('should return join date if joined', async () => {
      const joinDate = faker.date.past();
      mockParticipationsRepository.findByUserAndCampaign.mockResolvedValueOnce({
        userId,
        campaignId,
        createdAt: joinDate,
      });

      await expect(
        participationsService.checkUserJoinedCampaign(userId, campaignId),
      ).resolves.toBe(joinDate.toISOString());
    });
  });

  describe('checkParticipantLimitReached', () => {
    let campaign: CampaignEntity & { details: ThresholdCampaignDetails };

    beforeEach(() => {
      // @ts-expect-error - we know details is ThresholdCampaignDetails for this test suite
      campaign = generateCampaignEntity(CampaignType.THRESHOLD);
      campaign.details.maxParticipants = faker.number.int({ min: 1 });
    });

    it('should return false if not threshold campaign', async () => {
      campaign.type = faker.lorem.slug() as CampaignType;

      await expect(
        participationsService.checkParticipantLimitReached(campaign),
      ).resolves.toBe(false);
    });

    it('should return false if threshold campaign has no maxParticipants', async () => {
      delete campaign.details.maxParticipants;

      await expect(
        participationsService.checkParticipantLimitReached(campaign),
      ).resolves.toBe(false);
    });

    it('should return true if participant limit reached', async () => {
      mockParticipationsRepository.countParticipants.mockResolvedValueOnce(
        campaign.details.maxParticipants!,
      );

      await expect(
        participationsService.checkParticipantLimitReached(campaign),
      ).resolves.toBe(true);

      expect(
        mockParticipationsRepository.countParticipants,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsRepository.countParticipants,
      ).toHaveBeenCalledWith(campaign.id);
    });

    it('should return false if participant limit not reached', async () => {
      mockParticipationsRepository.countParticipants.mockResolvedValueOnce(
        campaign.details.maxParticipants! - 1,
      );

      await expect(
        participationsService.checkParticipantLimitReached(campaign),
      ).resolves.toBe(false);

      expect(
        mockParticipationsRepository.countParticipants,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockParticipationsRepository.countParticipants,
      ).toHaveBeenCalledWith(campaign.id);
    });
  });
});
