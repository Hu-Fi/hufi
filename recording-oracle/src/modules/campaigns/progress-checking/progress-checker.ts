import { Injectable } from '@nestjs/common';

import {
  ExchangeApiClientFactory,
  Trade,
  TradingSide,
} from '@/modules/exchange';

import type {
  AbuseDetector,
  CampaignProgressChecker,
  ProgressCheckInput,
  ProgressCheckResult,
} from './types';

const DEFAULT_ABUSE_DETECTOR: AbuseDetector = {
  checkTradeForAbuse() {
    return false;
  },
};

@Injectable()
export abstract class BaseCampaignProgressChecker
  implements CampaignProgressChecker
{
  protected abuseDetector: AbuseDetector;

  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
  ) {
    this.setAbuseDetector(DEFAULT_ABUSE_DETECTOR);
  }

  async check({
    exchangeName,
    apiClientOptions,
    pair,
    startDate,
    endDate,
  }: ProgressCheckInput): Promise<ProgressCheckResult> {
    let abuseDetected = false;

    const exchangeApiClient = this.exchangeApiClientFactory.create(
      exchangeName,
      apiClientOptions,
    );

    let score = 0;
    let totalVolume = 0;

    let since = startDate.valueOf();
    while (since < endDate.valueOf()) {
      const trades = await exchangeApiClient.fetchMyTrades(pair, since);
      if (trades.length === 0) {
        break;
      }

      for (const trade of trades) {
        if (trade.timestamp >= endDate.valueOf()) {
          break;
        }

        totalVolume += trade.side === TradingSide.BUY ? trade.cost : 0;
        score += this.calculateTradeScore(trade);
        if (this.abuseDetector.checkTradeForAbuse(trade)) {
          abuseDetected = true;
        }
      }

      since = trades[trades.length - 1].timestamp + 1;
    }

    return { abuseDetected, score, totalVolume };
  }

  setAbuseDetector(abuseDetectorToUse: AbuseDetector): void {
    this.abuseDetector = abuseDetectorToUse;
  }

  protected abstract calculateTradeScore(trade: Trade): number;
}
