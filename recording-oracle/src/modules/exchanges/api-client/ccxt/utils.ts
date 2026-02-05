import * as ccxt from 'ccxt';
import type { Trade as CcxtTrade } from 'ccxt';

import { ExchangeName } from '@/common/constants';

import type { Trade } from '../types';

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

export function mapCcxtError(error: unknown) {
  if (error instanceof ccxt.BaseError || error instanceof Error) {
    return {
      name: error.constructor.name,
      message: error.message,
    };
  }

  return error;
}

export const ERROR_EXCHANGE_NAME_PROP = Symbol(
  'extra "exchange name" property for ccxt error',
);

const ccxtApiAccessErrors = [
  ccxt.AccountNotEnabled,
  ccxt.AccountSuspended,
  ccxt.AuthenticationError,
  ccxt.BadSymbol,
  ccxt.PermissionDenied,
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isExchangeApiAccessError(error: any): error is Error {
  if (
    ccxtApiAccessErrors.some(
      (ccxtApiAccessError) => error instanceof ccxtApiAccessError,
    )
  ) {
    return true;
  }

  if (!error) {
    return false;
  }

  switch (error[ERROR_EXCHANGE_NAME_PROP]) {
    case ExchangeName.MEXC: {
      // https://www.mexc.com/api-docs/spot-v3/general-info#error-code
      /**
       * This can be returned e.g. in case when api key is removed.
       * NOTE: after it's removed it's still valid for some time on their end
       */
      if (error.message.includes('10072')) {
        return true;
      }

      /**
       * This can be returned in case when API key has IPs whitelist
       * but our application IP address is not there
       */
      if (error.message.includes('700006')) {
        return true;
      }

      /**
       * This can happen in case case deposit address not exist,
       * so user will have to create one
       */
      if (
        error instanceof ccxt.InvalidAddress &&
        error.message.includes('cannot find a deposit address')
      ) {
        return true;
      }

      return false;
    }
    case ExchangeName.GATE: {
      /**
       * This can happen in case case deposit address not exist,
       * so user will have to create one
       */
      if (
        error instanceof ccxt.InvalidAddress &&
        error.message.includes('address is undefined')
      ) {
        return true;
      }

      return false;
    }
    default:
      return false;
  }
}
