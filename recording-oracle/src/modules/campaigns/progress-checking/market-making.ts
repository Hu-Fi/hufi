import { ETH_TOKEN_SYMBOL, ExchangeName } from '@/common/constants';
import {
  ExchangesService,
  TakerOrMakerFlag,
  Trade,
  TradingSide,
} from '@/modules/exchanges';

import type {
  CampaignProgressChecker,
  CampaignProgressCheckerSetup,
  BaseProgressCheckResult,
  ParticipantInfo,
} from './types';

export type MarketMakingResult = BaseProgressCheckResult & {
  total_volume: number;
};

export type MarketMakingMeta = {
  total_volume: number;
};

export class MarketMakingProgressChecker implements CampaignProgressChecker<
  MarketMakingResult,
  MarketMakingMeta
> {
  readonly exchangeName: ExchangeName;
  readonly tradingPair: string;
  readonly tradingPeriodStart: Date;
  readonly tradingPeriodEnd: Date;

  private totalVolumeMeta: number = 0;

  protected readonly ethDepositAddresses = new Set<string>();

  constructor(
    private readonly exchangesService: ExchangesService,
    setupData: CampaignProgressCheckerSetup,
  ) {
    this.exchangeName = setupData.exchangeName;
    this.tradingPair = setupData.symbol;
    this.tradingPeriodStart = setupData.periodStart;
    this.tradingPeriodEnd = setupData.periodEnd;
  }

  async checkForParticipant(
    participant: ParticipantInfo,
  ): Promise<MarketMakingResult> {
    const exchangeApiClient = await this.exchangesService.getClientForUser(
      participant.id,
      this.exchangeName,
    );

    const ethDepositAddress =
      await exchangeApiClient.fetchDepositAddress(ETH_TOKEN_SYMBOL);

    if (this.ethDepositAddresses.has(ethDepositAddress)) {
      return { abuseDetected: true, score: 0, total_volume: 0 };
    } else {
      this.ethDepositAddresses.add(ethDepositAddress);
    }

    let score = 0;
    let totalVolume = 0;

    const since = Math.max(
      this.tradingPeriodStart.valueOf(),
      participant.joinedAt.valueOf(),
    );
    const tradesIterator = exchangeApiClient.fetchMyTrades(
      this.tradingPair,
      since,
      this.tradingPeriodEnd.valueOf(),
    );
    for await (const trades of tradesIterator) {
      for (const trade of trades) {
        totalVolume += trade.cost;
        score += this.calculateTradeScore(trade);
      }
    }

    /**
     * !!! NOTE !!!
     * There can be a situation where two campaign participants
     * have a trade between each other, so total volume
     * is not 100% accurate in this case, but probability of it is
     * negligible so omit it here. Later RepO can verify it if needed.
     */
    this.totalVolumeMeta += totalVolume;

    return { abuseDetected: false, score, total_volume: totalVolume };
  }

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
      ratio = 0.1;
    }

    return ratio * trade.cost;
  }

  getCollectedMeta(): MarketMakingMeta {
    return {
      total_volume: this.totalVolumeMeta,
    };
  }
}
