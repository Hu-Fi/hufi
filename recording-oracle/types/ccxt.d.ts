/**
 * Due to the project configuration and ccxt library internals
 * it resolves to commonjs module version (ccxt/dist/ccxt.cjs)
 * and under the hood "import * as ccxt from 'ccxt'" works as
 * "const ccxt = require('ccxt')", so we reflect it here as well.
 */

declare module 'ccxt' {
  // https://docs.ccxt.com/#/README?id=order-structure
  export type Order = {
    id: string;
    status: 'open' | 'closed' | 'canceled' | 'expired' | 'rejected';
    timestamp: number;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    amount: number;
    filled: number;
    cost: number;
    [x: string]: unknown;
  };

  // https://docs.ccxt.com/#/README?id=trade-structure
  export type Trade = {
    id: string;
    timestamp: number;
    symbol: string;
    order: string;
    side: 'buy' | 'sell';
    takerOrMaker: 'taker' | 'maker';
    price: number;
    amount: number;
    cost: number;
    [x: string]: unknown;
  };

  export type TokenBalances = {
    [token: string]: number;
  };

  export type AccountBalance = {
    free: TokenBalances;
    used: TokenBalances;
    total: TokenBalances;
  };

  export type AddressStructure = {
    currency: string;
    address: string;
    network?: string | null;
  };

  export interface Exchange {
    has: Record<string, boolean | undefined>;
    setSandboxMode(enabled: boolean): void;
    loadMarkets(): Promise<void>;
    setMarketsFromExchange(sourceExchange: unknown): void;
    checkRequiredCredentials(throwError?: boolean): boolean;
    fetchBalance(): Promise<AccountBalance>;
    fetchOpenOrders(symbol: string, since: number): Promise<Order[]>;
    fetchMyTrades(symbol: string, since: number): Promise<Trade[]>;
    fetchDepositAddress(
      symbol: string,
      params?: Record<string, unknown>,
    ): Promise<AddressStructure>;
  }

  const ccxt: {
    version: string;
    exchanges: string[];
    AccountNotEnabled: ErrorConstructor;
    AccountSuspended: ErrorConstructor;
    AuthenticationError: ErrorConstructor;
    BadSymbol: ErrorConstructor;
    PermissionDenied: ErrorConstructor;
    NetworkError: ErrorConstructor;
    [x: string]: new (options: {
      apiKey?: string;
      secret?: string;
    }) => Exchange;
  };
  export = ccxt;
}
