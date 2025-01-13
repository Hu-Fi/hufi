import { Injectable } from '@nestjs/common';
import * as ccxt from 'ccxt';

@Injectable()
export class CCXTService {
  constructor() {}

  public getExchangeInstance(
    exchangeName: string,
    apiKey: string,
    secret: string,
  ): ccxt.Exchange {
    // eslint-disable-next-line import/namespace
    const exchangeClass = ccxt.pro[exchangeName] || ccxt[exchangeName];
    if (!exchangeClass) {
      throw new Error(`Exchange ${exchangeName} not supported.`);
    }
    return new exchangeClass({ apiKey, secret });
  }

  public async fetchTradePairs(
    exchange: ccxt.Exchange,
  ): Promise<ccxt.Market[]> {
    return exchange.loadMarkets();
  }

  public async fetchTrades(
    exchange: ccxt.Exchange,
    symbol: string,
    since: number,
  ): Promise<ccxt.Trade[]> {
    return exchange.fetchMyTrades(symbol, since);
  }

  public async fetchOpenOrders(
    exchange: ccxt.Exchange,
    symbol: string,
    since: number,
  ): Promise<ccxt.Order[]> {
    return exchange.fetchOpenOrders(symbol, since);
  }

  public async fetchOrderBook(
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

  public async processOpenOrders(
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
      .filter((order) => order.timestamp < to)
      .reduce((acc, order) => {
        const orderCreationTime = new Date(order.timestamp).getTime();
        const duration = (now - orderCreationTime) / 1000; // Convert duration from milliseconds to seconds
        totalDuration += duration;
        return acc + order.cost;
      }, 0);

    const averageDuration = orders.length ? totalDuration / orders.length : 0;

    return { openOrderVolume, averageDuration, spread };
  }
}
