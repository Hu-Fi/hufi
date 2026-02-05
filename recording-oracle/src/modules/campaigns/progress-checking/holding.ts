import { ETH_TOKEN_SYMBOL, ExchangeName } from '@/common/constants';
import { ExchangesService } from '@/modules/exchanges';

import type {
  CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  BaseProgressCheckResult,
  ParticipantInfo,
} from './types';

export type HoldingResult = BaseProgressCheckResult & {
  token_balance: number;
};

export type HoldingMeta = {
  total_balance: number;
};

export class HoldingProgressChecker implements CampaignProgressChecker<
  HoldingResult,
  HoldingMeta
> {
  readonly exchangeName: ExchangeName;
  readonly holdingTokenSymbol: string;

  private totalBalanceMeta: number = 0;

  protected readonly ethDepositAddresses = new Set<string>();

  constructor(
    private readonly exchangesService: ExchangesService,
    setupData: CampaignProgressCheckerSetup,
  ) {
    this.exchangeName = setupData.exchangeName;
    this.holdingTokenSymbol = setupData.symbol;
  }

  async checkForParticipant(
    participant: ParticipantInfo,
  ): Promise<HoldingResult> {
    const exchangeApiClient = await this.exchangesService.getClientForUser(
      participant.id,
      this.exchangeName,
    );

    const [ethDepositAddress, accountBalance] = await Promise.all([
      exchangeApiClient.fetchDepositAddress(ETH_TOKEN_SYMBOL),
      exchangeApiClient.fetchBalance(),
    ]);

    let tokenBalance = accountBalance[this.holdingTokenSymbol]?.total || 0;
    let score = tokenBalance;

    let abuseDetected = false;
    if (this.ethDepositAddresses.has(ethDepositAddress)) {
      abuseDetected = true;
      score = 0;
      tokenBalance = 0;
    } else {
      this.ethDepositAddresses.add(ethDepositAddress);
    }

    this.totalBalanceMeta += tokenBalance;

    return { abuseDetected, score, token_balance: tokenBalance };
  }

  getCollectedMeta(): HoldingMeta {
    return {
      total_balance: this.totalBalanceMeta,
    };
  }
}
