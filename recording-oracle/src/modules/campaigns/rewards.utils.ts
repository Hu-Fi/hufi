import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import _ from 'lodash';

import type { CampaignEntity } from './campaign.entity';
import { CAMPAIGNS_DAILY_CYCLE } from './constants';
import type {
  CampaignProgressMeta,
  HoldingMeta,
  MarketMakingMeta,
  ThresholdMeta,
} from './progress-checking';
import {
  isCompetitiveMarketMakingCampaign,
  isHoldingCampaign,
  isMarketMakingCampaign,
  isThresholdCampaign,
} from './type-guards';
import type {
  CampaignProgress,
  CompetitiveMarketMakingCampaignDetails,
  ParticipantOutcome,
} from './types';

export function calculateDailyReward(campaign: CampaignEntity): string {
  const campaignDurationDays = Math.ceil(
    dayjs(campaign.endDate).diff(campaign.startDate, 'days', true),
  );

  const fundAmount = new Decimal(campaign.fundAmount);

  const dailyReward = fundAmount.div(campaignDurationDays);

  return dailyReward
    .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
    .toString();
}

export function calculateRewardPool(
  campaign: CampaignEntity,
  progress: CampaignProgress<CampaignProgressMeta>,
): string {
  const nRewardCycles = Math.ceil(
    dayjs(progress.to).diff(progress.from, 'days', true),
  );

  if (nRewardCycles > CAMPAIGNS_DAILY_CYCLE) {
    /**
     * TODO: handle "to_cancel" campaigns where cycle duration is > 1 day.
     *
     * Such can happend if RecO wasn't able to record results for a cycle in time
     * and cancellation request came in after the end of that cycle.
     * In that case we can't go cycle-by-cycly because `storeResults` can be called
     * only once for `to_cancel` escrows, so we need to have a special handling for that case.
     */
    throw new Error(
      `Unexpected number of reward cycles in progress period: ${nRewardCycles}`,
    );
  }
  let progressValue: number;
  let progressValueTarget: number;
  if (isMarketMakingCampaign(campaign)) {
    progressValue = (progress.meta as MarketMakingMeta).total_volume;
    progressValueTarget = campaign.details.dailyVolumeTarget;
  } else if (isCompetitiveMarketMakingCampaign(campaign)) {
    const eligibleParticipants = progress.participants_outcomes.filter(
      (outcome) =>
        (outcome.total_volume as number) >= campaign.details.minVolumeRequired,
    );
    if (eligibleParticipants.length === 0) {
      return '0';
    }

    /**
     * We are going to distribute the whole reward pool across top performers,
     * so for reward pool calculation we consider target as achieved.
     */
    progressValue = 1;
    progressValueTarget = progressValue;
  } else if (isHoldingCampaign(campaign)) {
    progressValue = (progress.meta as HoldingMeta).total_balance;
    progressValueTarget = campaign.details.dailyBalanceTarget;
  } else if (isThresholdCampaign(campaign)) {
    /**
     * 'total_score' in this case is the number of eligible participants in current cycle,
     * so when calculating reward pool we are going to distribute equal portion
     * of daily reward to each participant that reached the threshold,
     * where equal portion is defined as `dailyReward / maxParticipants`
     */
    // prettier-ignore
    const nEligibleParticipants = (progress.meta as ThresholdMeta).total_score;
    if (
      campaign.details.maxParticipants &&
      nEligibleParticipants > campaign.details.maxParticipants
    ) {
      // safety-belt
      throw new Error(
        `Unexpected number of eligible participants: ${nEligibleParticipants}, max allowed: ${campaign.details.maxParticipants}`,
      );
    }
    progressValue = nEligibleParticipants;
    progressValueTarget = campaign.details.maxParticipants || 1;
  } else {
    throw new Error(
      `Unknown campaign type for reward pool calculation: ${campaign.type}`,
    );
  }

  const dailyReward = calculateDailyReward(campaign);
  const progressRatio = Math.min(progressValue / progressValueTarget, 1);

  const rewardPool = Decimal.mul(dailyReward, progressRatio);

  return rewardPool
    .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN)
    .toString();
}

export function estimateRewards(
  participantOutcomes: ParticipantOutcome[],
  rewardPool: string,
): Record<string, number> {
  let totalScore = new Decimal(0);
  for (const participantOutcome of participantOutcomes) {
    totalScore = totalScore.add(participantOutcome.score);
  }

  const estimatedRewards: {
    [address: string]: number;
  } = {};

  for (const participantOutcome of participantOutcomes) {
    let estimatedReward: number;
    if (totalScore.equals(0) || participantOutcome.score === 0) {
      estimatedReward = 0;
    } else {
      const participantShare = Decimal.div(
        participantOutcome.score,
        totalScore,
      );
      estimatedReward = Decimal.mul(rewardPool, participantShare).toNumber();
    }

    estimatedRewards[participantOutcome.address] = estimatedReward;
  }

  return estimatedRewards;
}

export function estimateCompetitiveRewards(
  participantOutcomes: ParticipantOutcome[],
  rewardPool: string,
  campaign: CampaignEntity & {
    details: CompetitiveMarketMakingCampaignDetails;
  },
): Record<string, number> {
  const eligibleOutcomes: ParticipantOutcome[] = [];
  for (const participantOutcome of participantOutcomes) {
    if (
      participantOutcome.score > 0 &&
      (participantOutcome.total_volume as number) >=
        campaign.details.minVolumeRequired
    ) {
      eligibleOutcomes.push(participantOutcome);
    }
  }

  const sortedParticipantResults = _.orderBy(eligibleOutcomes, 'score', 'desc');

  const sortedRewardsDistribution = _.orderBy(
    campaign.details.rewardsDistribution,
    [],
    'desc',
  );

  const estimatedRewards: {
    [address: string]: number;
  } = {};

  let rankedResultIndex = 0;
  while (
    rankedResultIndex < sortedParticipantResults.length &&
    rankedResultIndex < sortedRewardsDistribution.length
  ) {
    const tiedResults = [sortedParticipantResults[rankedResultIndex]];

    let maybeTiedResultIndex = rankedResultIndex + 1;
    for (
      ;
      maybeTiedResultIndex < sortedParticipantResults.length;
      maybeTiedResultIndex += 1
    ) {
      const maybeTiedResult = sortedParticipantResults[maybeTiedResultIndex];
      if (maybeTiedResult.score !== tiedResults[0]!.score) {
        break;
      }
      tiedResults.push(maybeTiedResult);
    }

    const nTiedResults = tiedResults.length;
    const rewardSlots = sortedRewardsDistribution.slice(
      rankedResultIndex,
      rankedResultIndex + nTiedResults,
    );
    const totalRewardPercent = rewardSlots.reduce(
      (prev, curr) => Decimal.sum(prev, curr),
      new Decimal(0),
    );

    const rewardPerParticipant = Decimal.mul(rewardPool, totalRewardPercent)
      .div(100)
      .div(nTiedResults)
      .toDecimalPlaces(campaign.fundTokenDecimals, Decimal.ROUND_DOWN);

    if (rewardPerParticipant.greaterThan(0)) {
      for (const tiedResult of tiedResults) {
        estimatedRewards[tiedResult.address] = rewardPerParticipant.toNumber();
      }
    }

    rankedResultIndex = maybeTiedResultIndex;
  }

  for (const participantOutcome of participantOutcomes) {
    if (!estimatedRewards[participantOutcome.address]) {
      estimatedRewards[participantOutcome.address] = 0;
    }
  }

  return estimatedRewards;
}
