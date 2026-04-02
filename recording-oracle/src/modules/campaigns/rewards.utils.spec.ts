import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import type { CampaignEntity } from './campaign.entity';
import { generateCampaignEntity, generateCampaignProgress } from './fixtures';
import type {
  HoldingMeta,
  MarketMakingMeta,
  ThresholdMeta,
} from './progress-checking';
import * as rewardsUtils from './rewards.utils';
import {
  CampaignType,
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
});
