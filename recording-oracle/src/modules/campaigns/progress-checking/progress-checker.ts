import {
  ExchangeApiClientFactory,
  Trade,
  TradingSide,
} from '@/modules/exchange';

import type {
  CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  ParticipantAuthKeys,
  ProgressCheckResult,
} from './types';

const N_TRADES_FOR_ABUSE_CHECK = 5;

export abstract class BaseCampaignProgressChecker
  implements CampaignProgressChecker
{
  readonly exchangeName: string;
  readonly tradingPair: string;
  readonly tradingPeriodStart: Date;
  readonly tradingPeriodEnd: Date;

  private readonly tradeIdsSample = new Set<string>();

  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
    setupData: CampaignProgressCheckerSetup,
  ) {
    this.exchangeName = setupData.exchangeName;
    this.tradingPair = setupData.tradingPair;
    this.tradingPeriodStart = setupData.tradingPeriodStart;
    this.tradingPeriodEnd = setupData.tradingPeriodEnd;
  }

  async checkForParticipant(
    authKeys: ParticipantAuthKeys,
  ): Promise<ProgressCheckResult> {
    let abuseDetected = false;

    const exchangeApiClient = this.exchangeApiClientFactory.create(
      this.exchangeName,
      authKeys,
    );

    let score = 0;
    let totalVolume = 0;
    let nTradesSampled = 0;

    let since = this.tradingPeriodStart.valueOf();
    while (since < this.tradingPeriodEnd.valueOf() && !abuseDetected) {
      const trades = await exchangeApiClient.fetchMyTrades(
        this.tradingPair,
        since,
      );
      if (trades.length === 0) {
        break;
      }

      for (const trade of trades) {
        if (trade.timestamp >= this.tradingPeriodEnd.valueOf()) {
          break;
        }

        if (this.tradeIdsSample.has(trade.id)) {
          abuseDetected = true;
          break;
        }

        if (nTradesSampled < N_TRADES_FOR_ABUSE_CHECK) {
          this.tradeIdsSample.add(trade.id);
          nTradesSampled += 1;
        }

        totalVolume += trade.side === TradingSide.BUY ? trade.cost : 0;
        score += this.calculateTradeScore(trade);
      }

      since = trades[trades.length - 1].timestamp + 1;
    }

    if (abuseDetected) {
      score = 0;
      totalVolume = 0;
    }

    return { abuseDetected, score, totalVolume };
  }

  protected abstract calculateTradeScore(trade: Trade): number;
}
