import { Injectable, Logger } from '@nestjs/common';
import * as ccxt from 'ccxt';

@Injectable()
export class CCXTService {
  private readonly logger = new Logger(CCXTService.name);

  getExchangeInstance(
    exchangeName: string,
    apiKey?: string,
    secret?: string,
  ): ccxt.Exchange {
    const name = exchangeName.toLowerCase();

    // eslint-disable-next-line import/namespace
    const ExchangeClass = (ccxt.pro as any)[name] ?? (ccxt as any)[name];
    if (!ExchangeClass) {
      throw new Error(`Exchange "${exchangeName}" is not supported by CCXT.`);
    }

    return new ExchangeClass({
      apiKey,
      secret,
      enableRateLimit: true,
    }) as ccxt.Exchange;
  }

  async fetchTradePairs(exchange: ccxt.Exchange): Promise<ccxt.Market[]> {
    const markets = await exchange.loadMarkets();
    return Object.values(markets);
  }

  async fetchTrades(
    exchange: ccxt.Exchange,
    symbol: string,
    since: number,
  ): Promise<ccxt.Trade[]> {
    return exchange.fetchMyTrades(symbol, since);
  }

  async fetchOpenOrders(
    exchange: ccxt.Exchange,
    symbol: string,
    since: number,
  ): Promise<ccxt.Order[]> {
    return exchange.fetchOpenOrders(symbol, since);
  }

  async fetchOrderBook(
    exchange: ccxt.Exchange,
    symbol: string,
  ): Promise<ccxt.OrderBook> {
    return exchange.fetchOrderBook(symbol);
  }

  private calculateSpread(orderBook: ccxt.OrderBook): number {
    const bid = orderBook.bids.length ? orderBook.bids[0][0] : 0;
    const ask = orderBook.asks.length ? orderBook.asks[0][0] : 0;
    return bid && ask ? ask - bid : 0;
  }

  async processOpenOrders(
    exchange: ccxt.Exchange,
    symbol: string,
    since: number,
    to: number,
  ): Promise<{
    openOrderVolume: number;
    averageDuration: number;
    spread: number;
  }> {
    const orders = await this.fetchOpenOrders(exchange, symbol, since);

    const orderBook = await this.fetchOrderBook(exchange, symbol);
    const spread = this.calculateSpread(orderBook);

    const now = Date.now();
    let totalDuration = 0;

    const openOrderVolume = orders
      .filter((o) => o.timestamp < to)
      .reduce((acc, o) => {
        const cost =
          typeof o.cost === 'number' && Number.isFinite(o.cost)
            ? o.cost
            : (o.amount ?? 0) * (o.price ?? 0);
        const duration = (now - (o.timestamp ?? now)) / 1000; // seconds
        totalDuration += duration;
        return acc + cost;
      }, 0);

    const averageDuration = orders.length ? totalDuration / orders.length : 0;

    return { openOrderVolume, averageDuration, spread };
  }
}
