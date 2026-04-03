import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import _ from 'lodash';

import type { CampaignEntity } from './campaign.entity';
import {
  generateCampaignEntity,
  generateCampaignProgress,
  generateParticipantOutcome,
} from './fixtures';
import type {
  HoldingMeta,
  MarketMakingMeta,
  ThresholdMeta,
} from './progress-checking';
import * as rewardsUtils from './rewards.utils';
import {
  CampaignType,
  CompetitiveMarketMakingCampaignDetails,
  type HoldingCampaignDetails,
  type MarketMakingCampaignDetails,
  type ThresholdCampaignDetails,
} from './types';

describe('rewards utils', () => {
  describe('calculateDailyReward', () => {
    it('should correctly calculate reward when duration is integer number of days', () => {
      const duration = faker.number.int({ min: 1, max: 15 });
      const campaign = generateCampaignEntity();
      campaign.endDate = dayjs(campaign.startDate)
        .add(duration, 'days')
        .toDate();

      const dailyReward = rewardsUtils.calculateDailyReward(campaign);

      const expectedDailyReward = new Decimal(campaign.fundAmount)
        .div(duration)
        .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
        .toString();
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

      const dailyReward = rewardsUtils.calculateDailyReward(campaign);

      const expectedDailyReward = new Decimal(campaign.fundAmount)
        .div(duration)
        .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
        .toString();
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

      const dailyReward = rewardsUtils.calculateDailyReward(campaign);

      const expectedDailyReward = new Decimal(campaign.fundAmount)
        .div(duration)
        .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
        .toString();
      expect(dailyReward).toBe(expectedDailyReward);
    });
  });

  describe('calculateRewardPool', () => {
    let campaign: CampaignEntity;

    describe('market making campaigns', () => {
      beforeEach(() => {
        campaign = generateCampaignEntity(CampaignType.MARKET_MAKING);
      });

      it('should return 0 when generated volume is 0', () => {
        const progress = generateCampaignProgress(campaign);

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        expect(rewardPool).toBe('0');
      });

      it('should correctly calculate reward pool when generated volume is lower than target but not 0', () => {
        const progressValueTarget = (
          campaign.details as MarketMakingCampaignDetails
        ).dailyVolumeTarget;
        const progressValue = faker.number.float({
          min: 1,
          max: progressValueTarget,
        });
        const progress = generateCampaignProgress(campaign);
        (progress.meta as MarketMakingMeta).total_volume = progressValue;

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        const expectedRewardRatio = progressValue / progressValueTarget;
        const expectedRewardPool = new Decimal(
          rewardsUtils.calculateDailyReward(campaign),
        )
          .mul(expectedRewardRatio)
          .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
          .toString();
        expect(rewardPool).toBe(expectedRewardPool);
      });

      it('should correctly calculate reward pool when generated volume meets target', () => {
        const progressValueTarget = (
          campaign.details as MarketMakingCampaignDetails
        ).dailyVolumeTarget;
        const progressValue = faker.number.float({
          min: progressValueTarget,
          max: progressValueTarget * 10,
        });
        const progress = generateCampaignProgress(campaign);
        (progress.meta as MarketMakingMeta).total_volume = progressValue;

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        const expectedRewardPool = new Decimal(
          rewardsUtils.calculateDailyReward(campaign),
        )
          .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
          .toString();
        expect(rewardPool).toBe(expectedRewardPool);
      });
    });

    describe('competitive market making campaigns', () => {
      beforeEach(() => {
        campaign = generateCampaignEntity(
          CampaignType.COMPETITIVE_MARKET_MAKING,
        );
      });

      it('should return daily reward as reward pool', () => {
        const progress = generateCampaignProgress(campaign);

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        expect(rewardPool).toBe(rewardsUtils.calculateDailyReward(campaign));
      });
    });

    describe('holding campaigns', () => {
      beforeEach(() => {
        campaign = generateCampaignEntity(CampaignType.HOLDING);
      });

      it('should return 0 when held balance is 0', () => {
        const progress = generateCampaignProgress(campaign);

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        expect(rewardPool).toBe('0');
      });

      it('should correctly calculate reward pool when held balance is lower than target but not 0', () => {
        const progressValueTarget = (campaign.details as HoldingCampaignDetails)
          .dailyBalanceTarget;
        const progressValue = faker.number.float({
          min: 1,
          max: progressValueTarget,
        });
        const progress = generateCampaignProgress(campaign);
        (progress.meta as HoldingMeta).total_balance = progressValue;

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        const expectedRewardRatio = progressValue / progressValueTarget;
        const expectedRewardPool = new Decimal(
          rewardsUtils.calculateDailyReward(campaign),
        )
          .mul(expectedRewardRatio)
          .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
          .toString();
        expect(rewardPool).toBe(expectedRewardPool);
      });

      it('should correctly calculate reward pool when held balance meets target', () => {
        const progressValueTarget = (campaign.details as HoldingCampaignDetails)
          .dailyBalanceTarget;
        const progressValue = faker.number.float({
          min: progressValueTarget,
          max: progressValueTarget * 10,
        });
        const progress = generateCampaignProgress(campaign);
        (progress.meta as HoldingMeta).total_balance = progressValue;

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        const expectedRewardPool = new Decimal(
          rewardsUtils.calculateDailyReward(campaign),
        )
          .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
          .toString();
        expect(rewardPool).toBe(expectedRewardPool);
      });
    });

    describe('threshold campaigns', () => {
      beforeEach(() => {
        campaign = generateCampaignEntity(CampaignType.THRESHOLD);
      });

      it('should return 0 when no eligible participants', () => {
        const progressValueTarget = (
          campaign.details as ThresholdCampaignDetails
        ).minimumBalanceTarget;

        const progress = generateCampaignProgress(campaign);
        (progress.meta as ThresholdMeta).total_balance = faker.number.float({
          min: progressValueTarget,
          max: progressValueTarget * 10,
        });

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        expect(rewardPool).toBe('0');
      });

      it('should return correct value when no maxParticipants', () => {
        delete (campaign.details as ThresholdCampaignDetails).maxParticipants;

        const minimumBalanceTarget = (
          campaign.details as ThresholdCampaignDetails
        ).minimumBalanceTarget;

        const nEligible = faker.number.int({ min: 1, max: 10 });
        const nIneligible = faker.number.int({ min: 1, max: 10 });
        const progress = generateCampaignProgress(campaign);
        (progress.meta as ThresholdMeta) = {
          total_balance:
            nIneligible * minimumBalanceTarget * Math.random() +
            nEligible * minimumBalanceTarget,
          total_score: nEligible,
        };

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        const expectedRewardPool = rewardsUtils.calculateDailyReward(campaign);
        expect(rewardPool).toBe(expectedRewardPool);
      });

      it('should return correct value when there is maxParticipants', () => {
        const maxParticipants = faker.number.int({ min: 10, max: 100 });
        (campaign.details as ThresholdCampaignDetails).maxParticipants =
          maxParticipants;

        const minimumBalanceTarget = (
          campaign.details as ThresholdCampaignDetails
        ).minimumBalanceTarget;

        const nEligible = faker.number.int({
          min: 1,
          max: Math.floor(maxParticipants / 2),
        });
        const nIneligible = faker.number.int({
          min: 0,
          max: Math.floor(maxParticipants / 2),
        });
        const progress = generateCampaignProgress(campaign);
        (progress.meta as ThresholdMeta) = {
          total_balance:
            nIneligible * minimumBalanceTarget * Math.random() +
            nEligible * minimumBalanceTarget,
          total_score: nEligible,
        };

        const rewardPool = rewardsUtils.calculateRewardPool(campaign, progress);

        const expectedRewardPool = new Decimal(
          rewardsUtils.calculateDailyReward(campaign),
        )
          .mul(Math.min(nEligible / maxParticipants, 1))
          .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
          .toString();
        expect(rewardPool).toBe(expectedRewardPool);
      });
    });
  });

  describe('estimateRewards', () => {
    const campaignTypes = Object.values(CampaignType).filter(
      (t) => t !== CampaignType.COMPETITIVE_MARKET_MAKING,
    );
    let campaignType: CampaignType;

    beforeEach(() => {
      campaignType = faker.helpers.arrayElement(campaignTypes);
    });

    it('should return 0 rewards for all participants when total score is 0', () => {
      const participantOutcomes = Array.from({ length: 3 }).map(() =>
        generateParticipantOutcome(campaignType, { score: 0 }),
      );

      const estimatedRewards = rewardsUtils.estimateRewards(
        participantOutcomes,
        faker.number.int({ min: 1 }).toString(),
      );

      for (const reward of Object.values(estimatedRewards)) {
        expect(reward).toBe(0);
      }
    });

    it('should correctly estimate rewards based on scores', () => {
      const participantOutcomes = Array.from({ length: 3 }).map(() =>
        generateParticipantOutcome(campaignType, { score: 0 }),
      );

      const estimatedRewards = rewardsUtils.estimateRewards(
        participantOutcomes,
        faker.number.int({ min: 1 }).toString(),
      );

      for (const reward of Object.values(estimatedRewards)) {
        expect(reward).toBe(0);
      }
    });

    it('should correctly estimate rewards based on scores', () => {
      let totalScore = 0;

      const participantOutcomes = Array.from({
        length: faker.number.int({ min: 3, max: 10 }),
      }).map((_value, index) => {
        const score = index * 10;
        totalScore += score;

        return generateParticipantOutcome(campaignType, { score: index * 10 });
      });
      const rewardPool = faker.number.int({ min: 1 }).toString();

      const estimatedRewards = rewardsUtils.estimateRewards(
        participantOutcomes,
        rewardPool,
      );

      for (const participantOutcome of participantOutcomes) {
        const expectedReward = Decimal.div(participantOutcome.score, totalScore)
          .mul(rewardPool)
          .toNumber();
        expect(estimatedRewards[participantOutcome.address]).toBe(
          expectedReward,
        );
      }
    });
  });

  describe('estimateCompetitiveRewards', () => {
    let campaign: CampaignEntity & {
      details: CompetitiveMarketMakingCampaignDetails;
    };
    let eligibleVolume: number;
    let rewardPool: string;

    beforeAll(() => {
      // @ts-expect-error - we set expected type for campaign
      campaign = generateCampaignEntity(CampaignType.COMPETITIVE_MARKET_MAKING);
      eligibleVolume =
        campaign.details.minVolumeRequired + faker.number.float();
      rewardPool = faker.number.int({ min: 1 }).toString();
    });

    it('should return 0 when participant score is 0', () => {
      const participantOutcome = generateParticipantOutcome(campaign.type, {
        score: 0,
      });

      const estimatedRewards = rewardsUtils.estimateCompetitiveRewards(
        [participantOutcome],
        rewardPool,
        campaign,
      );

      expect(estimatedRewards[participantOutcome.address]).toBe(0);
    });

    it('should return 0 when participant has not generated enough volume', () => {
      const participantOutcome = generateParticipantOutcome(campaign.type, {
        total_volume: faker.number.float({
          min: 0,
          max: campaign.details.minVolumeRequired - 0.00001,
        }),
      });

      const estimatedRewards = rewardsUtils.estimateCompetitiveRewards(
        [participantOutcome],
        rewardPool,
        campaign,
      );

      expect(estimatedRewards[participantOutcome.address]).toBe(0);
    });

    it('should return 0 when participant is not in top list', () => {
      const topParticipantsScore = faker.number.int({ min: 1 });

      const topParticipantsOutcomes = Array.from({
        length: campaign.details.rewardsDistribution.length,
      }).map(() =>
        generateParticipantOutcome(campaign.type, {
          score: topParticipantsScore,
          total_volume: eligibleVolume,
        }),
      );
      const notTopParticipantOutcome = generateParticipantOutcome(
        campaign.type,
        {
          score: topParticipantsScore - 1,
          total_volume: eligibleVolume,
        },
      );

      const estimatedRewards = rewardsUtils.estimateCompetitiveRewards(
        faker.helpers.shuffle([
          ...topParticipantsOutcomes,
          notTopParticipantOutcome,
        ]),
        rewardPool,
        campaign,
      );

      expect(estimatedRewards[notTopParticipantOutcome.address]).toBe(0);
      for (const topParticipantOutcome of topParticipantsOutcomes) {
        expect(estimatedRewards[topParticipantOutcome.address]).toBeGreaterThan(
          0,
        );
      }
    });

    it('should return equal rewards if all tie', () => {
      const topParticipantsScore = faker.number.int({ min: 1 });

      const topParticipantsOutcomes = Array.from({
        length: campaign.details.rewardsDistribution.length,
      }).map(() =>
        generateParticipantOutcome(campaign.type, {
          score: topParticipantsScore,
          total_volume: eligibleVolume,
        }),
      );

      const estimatedRewards = rewardsUtils.estimateCompetitiveRewards(
        faker.helpers.shuffle(topParticipantsOutcomes),
        rewardPool,
        campaign,
      );

      const tieReward = Decimal.div(
        _.sum(campaign.details.rewardsDistribution),
        100,
      )
        .mul(rewardPool)
        .div(topParticipantsOutcomes.length)
        .toNumber();

      for (const topParticipantOutcome of topParticipantsOutcomes) {
        expect(estimatedRewards[topParticipantOutcome.address]).toBe(tieReward);
      }
    });

    it('should correctly estimate rewards based on scores and rewards distribution', () => {
      campaign.details.rewardsDistribution = [30, 20, 50];

      const eligibleVolume =
        campaign.details.minVolumeRequired + faker.number.float({ min: 0.001 });

      const firstPlaceParticipant = generateParticipantOutcome(campaign.type, {
        score: 4,
        total_volume: eligibleVolume,
      });
      const secondPlaceParticipant = generateParticipantOutcome(campaign.type, {
        score: 3,
        total_volume: eligibleVolume,
      });
      const thirdPlaceParticipant = generateParticipantOutcome(campaign.type, {
        score: 2,
        total_volume: eligibleVolume,
      });
      const notTop3Participant = generateParticipantOutcome(campaign.type, {
        score: 1,
        total_volume: eligibleVolume,
      });

      const rewardPool = '100';

      const estimatedRewards = rewardsUtils.estimateCompetitiveRewards(
        faker.helpers.shuffle([
          firstPlaceParticipant,
          secondPlaceParticipant,
          thirdPlaceParticipant,
          notTop3Participant,
        ]),
        rewardPool,
        campaign,
      );

      expect(estimatedRewards[firstPlaceParticipant.address]).toBe(50);
      expect(estimatedRewards[secondPlaceParticipant.address]).toBe(30);
      expect(estimatedRewards[thirdPlaceParticipant.address]).toBe(20);
      expect(estimatedRewards[notTop3Participant.address]).toBe(0);
    });
  });
});
