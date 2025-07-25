import { Injectable } from '@nestjs/common';

import { TakerOrMakerFlag, Trade, TradingSide } from '@/modules/exchange';

import { BaseCampaignProgressChecker } from './progress-checker';

@Injectable()
export class MarketMakingResultsChecker extends BaseCampaignProgressChecker {
  protected calculateTradeScore(trade: Trade): number {
    let ratio: number;

    if (trade.takerOrMaker === TakerOrMakerFlag.MAKER) {
      // Market making trade, no matter which side
      ratio = 1;
    } else if (trade.side === TradingSide.BUY) {
      // "taker" trade on "buy" side
      ratio = 0.42;
    } else {
      // "taker" sells
      ratio = 0;
    }

    return ratio * trade.cost;
  }
}
