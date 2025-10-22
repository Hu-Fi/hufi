import * as ccxt from 'ccxt';
import type { Exchange, Order as CcxtOrder, Trade as CcxtTrade } from 'ccxt';

import { ETH_TOKEN_SYMBOL, ETH_USDT_PAIR } from '@/common/constants';
import logger from '@/logger';
import type { Logger } from '@/logger';

import { ExchangeApiAccessError, ExchangeApiClientError } from './errors';
import type { ExchangeApiClient } from './exchange-api-client.interface';
import { AccountBalance, Order, Trade } from './types';

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

const ccxtApiAccessErrors = [
  ccxt.AccountNotEnabled,
  ccxt.AccountSuspended,
  ccxt.AuthenticationError,
  ccxt.BadSymbol,
  ccxt.PermissionDenied,
] as const;

type CcxtApiAccessError = InstanceType<(typeof ccxtApiAccessErrors)[number]>;

function isCcxtApiAccessError(error: unknown): error is CcxtApiAccessError {
  if (
    ccxtApiAccessErrors.some(
      (ccxtApiAccessError) => error instanceof ccxtApiAccessError,
    )
  ) {
    return true;
  }

  return false;
}

function CatchApiAccessErrors() {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      try {
        return await original.apply(this, args);
      } catch (error) {
        if (isCcxtApiAccessError(error)) {
          throw new ExchangeApiAccessError(
            `Api access failed for ${propertyKey}`,
            error.message,
          );
        }

        throw error;
      }
    };
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
      // for MARKET_MAKING campaigns
      await this.fetchMyTrades(ETH_USDT_PAIR, Date.now());
      // for HOLDING campaigns
      await this.fetchBalance();
      await this.fetchDepositAddress(ETH_TOKEN_SYMBOL);
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

  @CatchApiAccessErrors()
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
  @CatchApiAccessErrors()
  async fetchMyTrades(symbol: string, since: number): Promise<Trade[]> {
    /**
     * Use default value for "limit" because it varies
     * from exchange to exchange.
     */
    const trades = await this.ccxtClient.fetchMyTrades(symbol, since);

    return trades.map(mapCcxtTrade);
  }

  @CatchApiAccessErrors()
  async fetchBalance(): Promise<AccountBalance> {
    const balance = await this.ccxtClient.fetchBalance();

    return balance;
  }

  @CatchApiAccessErrors()
  async fetchDepositAddress(symbol: string): Promise<string> {
    const fetchParams: Record<string, unknown> = {};

    switch (this.exchangeName) {
      case 'gate': {
        fetchParams.network = 'ERC20';
      }
    }

    const result = await this.ccxtClient.fetchDepositAddress(
      symbol,
      fetchParams,
    );

    return result.address;
  }
}
