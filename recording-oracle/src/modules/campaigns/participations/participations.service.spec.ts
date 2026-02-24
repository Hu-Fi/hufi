import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { createDuplicatedKeyError } from '~/test/fixtures/database';

import { ParticipationsRepository } from './participations.repository';
import { ParticipationsService } from './participations.service';

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
    let campaignId: string;

    beforeAll(() => {
      jest.useFakeTimers({ now: testFakeDate });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    beforeEach(() => {
      userId = faker.string.uuid();
      campaignId = faker.string.uuid();
    });

    it('should join user to campaign if no race condition', async () => {
      mockParticipationsRepository.insert.mockResolvedValueOnce({} as never);

      await expect(
        participationsService.joinCampaign(userId, campaignId),
      ).resolves.toBeUndefined();

      expect(mockParticipationsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockParticipationsRepository.insert).toHaveBeenCalledWith({
        userId,
        campaignId,
        createdAt: testFakeDate,
      });
    });

    it('should join user to campaign if joined with race condition', async () => {
      mockParticipationsRepository.insert.mockRejectedValueOnce(
        createDuplicatedKeyError(),
      );

      await expect(
        participationsService.joinCampaign(userId, campaignId),
      ).resolves.toBeUndefined();

      expect(mockParticipationsRepository.insert).toHaveBeenCalledTimes(1);
      expect(mockParticipationsRepository.insert).toHaveBeenCalledWith({
        userId,
        campaignId,
        createdAt: testFakeDate,
      });
    });

    it('should re-throw unexpected errors', async () => {
      const syntheticError = new Error(faker.lorem.sentence());

      mockParticipationsRepository.insert.mockRejectedValueOnce(syntheticError);

      await expect(
        participationsService.joinCampaign(userId, campaignId),
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
});
