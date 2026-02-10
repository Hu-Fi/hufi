import { TakerOrMakerFlag, TradingSide, type Trade } from '../types';
import type { ApiTrade } from './types';

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
    /**
     * If taker_fee is null - then the order wasn't filled instantly
     * and it's considered a "market maker" behavior.
     */
    takerOrMaker:
      trade.taker_fee === null
        ? TakerOrMakerFlag.MAKER
        : TakerOrMakerFlag.TAKER,
    /**
     * If user placed a BID - they wanted to buy.
     * If user placed an ASK - they wanted to sell.
     * If it was a SELF_TRADING - always consider it as a "sell"
     * to reflect the maker/taker behavior and have correct score later.
     */
    side: trade.side === 'BID' ? TradingSide.BUY : TradingSide.SELL,
    price: Number(trade.price),
    amount: Number(trade.amount),
    cost: -1,
  };

  mapped.cost = mapped.price * mapped.amount;

  return mapped;
}
