import { Injectable } from '@nestjs/common';

import { ExchangeApiClientFactory, Order, Trade } from '@/modules/exchange';

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
      const openOrders = await exchangeApiClient.fetchOpenOrders(pair, since);
      if (openOrders.length === 0) {
        break;
      }

      for (const order of openOrders) {
        totalVolume += order.cost;
        score += this.calculateOpenOrderScore(order);
      }

      since = openOrders[openOrders.length - 1].timestamp + 1;
    }

    since = startDate.valueOf();
    while (since < endDate.valueOf()) {
      const trades = await exchangeApiClient.fetchTrades(pair, since);
      if (trades.length === 0) {
        break;
      }

      for (const trade of trades) {
        totalVolume += trade.cost;
        score += this.calculateTradeScore(trade);
      }

      since = trades[trades.length - 1].timestamp + 1;
    }

    return { score, totalVolume };
  }

  private calculateOpenOrderScore(order: Order): number {
    if (order.side !== 'buy' || order.type === 'market') {
      return 0;
    }

    const fillRatio = order.filled / order.amount;
    return order.cost * fillRatio;
  }

  private calculateTradeScore(trade: Trade): number {
    /**
     * Note: it can be "maker" for any trade side
     */
    if (trade.takerOrMaker === 'maker') {
      return trade.cost;
    }

    return 0;
  }
}
