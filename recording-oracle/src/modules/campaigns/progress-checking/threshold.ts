import { ETH_TOKEN_SYMBOL, ExchangeName } from '@/common/constants';
import { ExchangesService } from '@/modules/exchanges';

import type {
  CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  BaseProgressCheckResult,
  ParticipantInfo,
} from './types';

export type ThresholdResult = BaseProgressCheckResult & {
  token_balance: number;
};

export type ThresholdMeta = {
  total_balance: number;
  total_score: number;
};

export class ThresholdProgressChecker implements CampaignProgressChecker<
  ThresholdResult,
  ThresholdMeta
> {
  readonly exchangeName: ExchangeName;
  readonly thresholdTokenSymbol: string;
  readonly minimumBalanceTarget: number;

  private totalBalanceMeta: number = 0;
  private totalScoreMeta: number = 0;

  protected readonly ethDepositAddresses = new Set<string>();

  constructor(
    private readonly exchangesService: ExchangesService,
    setupData: CampaignProgressCheckerSetup,
  ) {
    this.exchangeName = setupData.exchangeName;
    this.thresholdTokenSymbol = setupData.symbol;
    if (setupData.minimumBalanceTarget) {
      this.minimumBalanceTarget = setupData.minimumBalanceTarget as number;
    } else {
      // Safety belt: should not happen
      throw new Error('No minimum balance target provided');
    }
  }

  async checkForParticipant(
    participant: ParticipantInfo,
  ): Promise<ThresholdResult> {
    const exchangeApiClient = await this.exchangesService.getClientForUser(
      participant.id,
      this.exchangeName,
    );

    const [ethDepositAddress, accountBalance] = await Promise.all([
      exchangeApiClient.fetchDepositAddress(ETH_TOKEN_SYMBOL),
      exchangeApiClient.fetchBalance(),
    ]);

    let tokenBalance = accountBalance.total[this.thresholdTokenSymbol] || 0;
    let score = tokenBalance >= this.minimumBalanceTarget ? 1 : 0;

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
