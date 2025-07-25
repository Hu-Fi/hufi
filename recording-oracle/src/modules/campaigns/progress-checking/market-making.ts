import { Injectable } from '@nestjs/common';

import {
  ExchangeApiClientFactory,
  TakerOrMakerFlag,
  Trade,
  TradingSide,
} from '@/modules/exchange';

import type {
  CampaignProgressChecker,
  MarketMakingResult,
  ProgressCheckInput,
} from './types';

@Injectable()
export class MarketMakingResultsChecker implements CampaignProgressChecker {
  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
  ) {}

  async check({
    exchangeName,
    apiClientOptions,
    pair,
    startDate,
    endDate,
  }: ProgressCheckInput): Promise<MarketMakingResult> {
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
      }

      since = trades[trades.length - 1].timestamp + 1;
    }

    return { score, totalVolume };
  }

  private calculateTradeScore(trade: Trade): number {
    let ratio: number;

    if (trade.takerOrMaker === TakerOrMakerFlag.MAKER) {
      // Market making trade, no matter which side
      ratio = 1;
    } else if (trade.side === TradingSide.BUY) {
      // "taker" trade on "buy" side
      ratio = 0.42;
    } else {
      // "taker" sells
      ratio = 0;
    }

    return ratio * trade.cost;
  }
}
