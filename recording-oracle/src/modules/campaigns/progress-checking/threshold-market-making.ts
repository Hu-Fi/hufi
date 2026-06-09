import { ExchangesService } from '@/modules/exchanges';

import {
  type MarketMakingResult,
  type MarketMakingMeta,
  MarketMakingProgressChecker,
} from './market-making';
import type {
  CampaignProgressCheckerSetup,
  ParticipantInfo,
  ThresholdScore,
} from './types';

export type ThresholdMarketMakingResult = MarketMakingResult & {
  score: ThresholdScore;
};

export type ThresholdMarketMakingMeta = MarketMakingMeta & {
  total_score: number;
};

export class ThresholdMarketMakingProgressChecker extends MarketMakingProgressChecker {
  readonly minimumVolumeTarget: number;

  private totalScoreMeta: number = 0;

  constructor(
    exchangesService: ExchangesService,
    setupData: CampaignProgressCheckerSetup,
  ) {
    super(exchangesService, setupData);

    if (setupData.minimumVolumeTarget) {
      this.minimumVolumeTarget = setupData.minimumVolumeTarget as number;
    } else {
      // Safety belt: should not happen
      throw new Error('No minimum volume target provided');
    }
  }

  async checkForParticipant(
    participant: ParticipantInfo,
  ): Promise<ThresholdMarketMakingResult> {
    const marketMakingResult = await super.checkForParticipant(participant);

    const score =
      marketMakingResult.total_volume >= this.minimumVolumeTarget ? 1 : 0;

    this.totalScoreMeta += score;

    return { ...marketMakingResult, score };
  }

  getCollectedMeta(): ThresholdMarketMakingMeta {
    const marketMakingMeta = super.getCollectedMeta();

    return {
      ...marketMakingMeta,
      total_score: this.totalScoreMeta,
    };
  }
}
