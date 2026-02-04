import { TakerOrMakerFlag, TradingSide, type Trade } from '../types';
import { MAX_LOOKBACK_MS } from './constants';
import type { ApiTrade } from './types';

export function isAcceptableTimestamp(timestamp: unknown): boolean {
  if (typeof timestamp !== 'number') {
    return false;
  }

  if (timestamp > Date.now()) {
    return false;
  }

  if (timestamp < Date.now() - MAX_LOOKBACK_MS) {
    return false;
  }

  return true;
}

export function mapSymbolToAssetPair(symbol: string): string {
  return symbol.replace('/', '-');
}

export function mapAssetPairToSymbol(symbol: string): string {
  return symbol.replace('-', '/');
}

export function mapTrade(trade: ApiTrade): Trade {
  const mapped: Trade = {
    id: `${trade.id}`,
    symbol: mapAssetPairToSymbol(trade.asset_pair_name),
    timestamp: new Date(trade.created_at).valueOf(),
    takerOrMaker:
      trade.taker_fee === null
        ? TakerOrMakerFlag.MAKER
        : TakerOrMakerFlag.TAKER,
    side: trade.taker_side === 'ASK' ? TradingSide.BUY : TradingSide.SELL,
    price: Number(trade.price),
    amount: Number(trade.amount),
    cost: -1,
  };

  mapped.cost = mapped.price * mapped.amount;

  return mapped;
}
