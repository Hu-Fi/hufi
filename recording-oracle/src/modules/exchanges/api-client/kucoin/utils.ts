import crypto from 'crypto';

import { Trade } from '../types';
import { ApiPermissionErrorCode, ApiPermissionErrorCodes } from './constants';
import { KucoinApiError } from './error';
import { ApiSpotTrade } from './types';

export function getRawQuery(params: Record<string, unknown>): string {
  const entires: string[] = [];

  for (const [paramKey, paramValue] of Object.entries(params)) {
    const values = Array.isArray(paramValue) ? paramValue : [paramValue];
    for (const value of values) {
      if (value !== undefined) {
        entires.push(`${paramKey}=${value}`);
      }
    }
  }
  return entires.join('&');
}

export function kcSign(plain: Buffer, key: Buffer): string {
  return crypto
    .createHmac('sha256', key)
    .update(plain)
    .digest()
    .toString('base64');
}

export function isApiPermissionError(
  error: unknown,
): error is KucoinApiError & { code: ApiPermissionErrorCode } {
  return (
    error instanceof KucoinApiError &&
    ApiPermissionErrorCodes.includes(error.code as ApiPermissionErrorCode)
  );
}

export function mapSymbolToKcSymbol(symbol: string): string {
  return symbol.replace('/', '-');
}

export function mapKcSymbolToSymbol(symbol: string): string {
  return symbol.replace('-', '/');
}

export function mapTrade(apiTrade: ApiSpotTrade): Trade {
  return {
    id: apiTrade.tradeId.toString(),
    timestamp: apiTrade.createdAt,
    symbol: mapKcSymbolToSymbol(apiTrade.symbol),
    side: apiTrade.side,
    takerOrMaker: apiTrade.liquidity,
    price: Number(apiTrade.price),
    amount: Number(apiTrade.size),
    cost: Number(apiTrade.funds),
  };
}
