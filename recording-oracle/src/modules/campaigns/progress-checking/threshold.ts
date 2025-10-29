import { ETH_TOKEN_SYMBOL } from '@/common/constants';
import { ExchangeApiClientFactory } from '@/modules/exchange';

import type {
  CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  ParticipantAuthKeys,
  BaseProgressCheckResult,
} from './types';

export type ThresholdResult = BaseProgressCheckResult & {
  token_balance: number;
};

export type ThresholdMeta = {
  total_balance: number;
  total_score: number;
};

export class ThresholdProgressChecker
  implements CampaignProgressChecker<ThresholdResult, ThresholdMeta>
{
  readonly exchangeName: string;
  readonly thresholdTokenSymbol: string;
  readonly minumumBalanceTarget: number;

  private totalBalanceMeta: number = 0;
  private totalScoreMeta: number = 0;

  protected readonly ethDepositAddresses = new Set<string>();

  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
    setupData: CampaignProgressCheckerSetup,
  ) {
    this.exchangeName = setupData.exchangeName;
    this.thresholdTokenSymbol = setupData.symbol;
    if (setupData.minumumBalanceTarget) {
      this.minumumBalanceTarget = setupData.minumumBalanceTarget as number;
    } else {
      // Safety belt: should not happen
      throw new Error('No minimum balance target provided');
    }
  }

  async checkForParticipant(
    authKeys: ParticipantAuthKeys,
  ): Promise<ThresholdResult> {
    const exchangeApiClient = this.exchangeApiClientFactory.create(
      this.exchangeName,
      authKeys,
    );

    const [ethDepositAddress, accountBalance] = await Promise.all([
      exchangeApiClient.fetchDepositAddress(ETH_TOKEN_SYMBOL),
      exchangeApiClient.fetchBalance(),
    ]);

    let tokenBalance = accountBalance.total[this.thresholdTokenSymbol] || 0;
    let score = tokenBalance >= this.minumumBalanceTarget ? 1 : 0;

    let abuseDetected = false;
    if (this.ethDepositAddresses.has(ethDepositAddress)) {
      abuseDetected = true;
      score = 0;
      tokenBalance = 0;
    } else {
      this.ethDepositAddresses.add(ethDepositAddress);
    }

    this.totalBalanceMeta += tokenBalance;
    this.totalScoreMeta += score;

    return { abuseDetected, score, token_balance: tokenBalance };
  }

  getCollectedMeta(): ThresholdMeta {
    return {
      total_balance: this.totalBalanceMeta,
      total_score: this.totalScoreMeta,
    };
  }
}
