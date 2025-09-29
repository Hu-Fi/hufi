import { ETH_TOKEN_SYMBOL } from '@/common/constants';
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

  private totalBalanceMeta: number = 0;

  protected readonly ethDepositAddresses = new Set<string>();

  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
    setupData: CampaignProgressCheckerSetup,
  ) {
    this.exchangeName = setupData.exchangeName;
    this.holdingTokenSymbol = setupData.symbol;
  }

  async checkForParticipant(
    authKeys: ParticipantAuthKeys,
  ): Promise<HoldingResult> {
    const exchangeApiClient = this.exchangeApiClientFactory.create(
      this.exchangeName,
      authKeys,
    );

    const [ethDepositAddress, accountBalance] = await Promise.all([
      exchangeApiClient.fetchDepositAddress(ETH_TOKEN_SYMBOL),
      exchangeApiClient.fetchBalance(),
    ]);

    const tokenBalance = accountBalance.total[this.holdingTokenSymbol] || 0;

    if (this.ethDepositAddresses.has(ethDepositAddress)) {
      return { abuseDetected: true, score: 0, token_balance: tokenBalance };
    } else {
      this.ethDepositAddresses.add(ethDepositAddress);

      this.totalBalanceMeta += tokenBalance;

      return {
        abuseDetected: false,
        score: tokenBalance,
        token_balance: tokenBalance,
      };
    }
  }

  getCollectedMeta(): HoldingMeta {
    return {
      total_balance: this.totalBalanceMeta,
    };
  }
}
