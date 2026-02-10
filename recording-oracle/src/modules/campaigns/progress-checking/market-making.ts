import { ExchangeName } from '@/common/constants';
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

const N_TRADES_FOR_ABUSE_CHECK = 5;

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

  protected readonly tradeSamples = new Set<string>();

  private totalVolumeMeta: number = 0;

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
    let abuseDetected = false;

    const exchangeApiClient = await this.exchangesService.getClientForUser(
      participant.id,
      this.exchangeName,
    );

    let score = 0;
    let totalVolume = 0;
    let nTradesSampled = 0;

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
        const tradeFingerprint = this.getTradeFingerprint(trade);
        if (this.tradeSamples.has(tradeFingerprint)) {
          abuseDetected = true;
          break;
        }

        if (nTradesSampled < N_TRADES_FOR_ABUSE_CHECK) {
          this.tradeSamples.add(tradeFingerprint);
          nTradesSampled += 1;
        }

        totalVolume += trade.cost;
        score += this.calculateTradeScore(trade);
      }

      if (abuseDetected) {
        score = 0;
        totalVolume = 0;
        break;
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

    return { abuseDetected, score, total_volume: totalVolume };
  }

  private getTradeFingerprint(trade: Trade): string {
    return `${trade.id}-${trade.side}`;
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
