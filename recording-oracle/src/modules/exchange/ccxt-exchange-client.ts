import * as ccxt from 'ccxt';
import type { Exchange, Order as CcxtOrder, Trade as CcxtTrade } from 'ccxt';

import logger from '@/logger';
import type { Logger } from '@/logger';

import { ExchangeApiClientError } from './errors';
import type { ExchangeApiClient } from './exchange-api-client.interface';
import { Order, Trade } from './types';

type InitOptions = {
  apiKey: string;
  secret: string;
  sandbox?: boolean;
};

export function mapCcxtOrder(order: CcxtOrder): Order {
  return {
    id: order.id,
    status: order.status,
    timestamp: order.timestamp,
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    amount: order.amount,
    filled: order.filled,
    cost: order.cost,
  };
}

export function mapCcxtTrade(trade: CcxtTrade): Trade {
  return {
    id: trade.id,
    timestamp: trade.timestamp,
    symbol: trade.symbol,
    side: trade.side,
    takerOrMaker: trade.takerOrMaker,
    price: trade.price,
    amount: trade.amount,
    cost: trade.cost,
  };
}

export class CcxtExchangeClient implements ExchangeApiClient {
  private logger: Logger;
  private ccxtClient: Exchange;

  constructor(
    readonly exchangeName: string,
    { apiKey, secret, sandbox }: InitOptions,
  ) {
    if (!(exchangeName in ccxt)) {
      throw new Error(`Exchange not supported: ${exchangeName}`);
    }

    const exchangeClass = ccxt[exchangeName];
    this.ccxtClient = new exchangeClass({ apiKey, secret });

    const _sandbox = Boolean(sandbox);
    if (_sandbox) {
      this.ccxtClient.setSandboxMode(true);
    }

    this.logger = logger.child({
      context: CcxtExchangeClient.name,
      exchangeName,
      sandbox: _sandbox,
    });
  }

  checkRequiredCredentials(): boolean {
    return this.ccxtClient.checkRequiredCredentials(false);
  }

  async checkRequiredAccess(): Promise<boolean> {
    try {
      await this.ccxtClient.fetchBalance();
      return true;
    } catch (error) {
      if (error instanceof ccxt.NetworkError) {
        const message = 'Error while checking exchange access';
        this.logger.error(message, error);
        throw new ExchangeApiClientError(message);
      }

      return false;
    }
  }

  async fetchOpenOrders(symbol: string, since: number): Promise<Order[]> {
    /**
     * Use default value for "limit" because it varies
     * from exchange to exchange.
     */
    const orders = await this.ccxtClient.fetchOpenOrders(symbol, since);

    return orders.map(mapCcxtOrder);
  }

  /**
   * Returns all historical trades, both for fully and partially filled orders,
   * i.e. returns historical data for actual buy/sell that happened.
   */
  async fetchMyTrades(symbol: string, since: number): Promise<Trade[]> {
    /**
     * Use default value for "limit" because it varies
     * from exchange to exchange.
     */
    const trades = await this.ccxtClient.fetchMyTrades(symbol, since);

    return trades.map(mapCcxtTrade);
  }
}
