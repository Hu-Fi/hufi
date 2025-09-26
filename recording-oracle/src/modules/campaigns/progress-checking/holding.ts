import { ExchangeApiClientFactory } from '@/modules/exchange';

import type {
  CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  ParticipantAuthKeys,
  BaseProgressCheckResult,
} from './types';

export type HoldingResult = BaseProgressCheckResult & {
  token_balance: number;
};

export type HoldingMeta = {
  total_balance: number;
};

/**
 * TODO
 *
 * Unit-test coverage
 */
export class HoldingProgressChecker
  implements CampaignProgressChecker<HoldingResult, HoldingMeta>
{
  readonly exchangeName: string;
  readonly holdingTokenSymbol: string;

  private totalBalanceMeta: number;

  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
    setupData: CampaignProgressCheckerSetup,
  ) {
    this.exchangeName = setupData.exchangeName;
    this.holdingTokenSymbol = setupData.symbol;

    // meta data section
    this.totalBalanceMeta = 0;
  }

  async checkForParticipant(
    authKeys: ParticipantAuthKeys,
  ): Promise<HoldingResult> {
    const exchangeApiClient = this.exchangeApiClientFactory.create(
      this.exchangeName,
      authKeys,
    );

    const accountBalance = await exchangeApiClient.fetchBalance();

    /**
     * TODO
     *
     * Add abuse check based on some account id info
     */
    const tokenBalance = accountBalance.total[this.holdingTokenSymbol] || 0;
    const score = tokenBalance;

    this.totalBalanceMeta += tokenBalance;

    return { abuseDetected: false, score, token_balance: tokenBalance };
  }

  getCollectedMeta(): HoldingMeta {
    return {
      total_balance: this.totalBalanceMeta,
    };
  }
}
