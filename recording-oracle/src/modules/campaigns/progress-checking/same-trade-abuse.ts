import _ from 'lodash';
import { LRUCache } from 'lru-cache';

import { Trade } from '@/modules/exchange';

import { AbuseDetector } from './types';

export class SameTradeAbuseDetector implements AbuseDetector {
  private readonly tradeIdsSample = new LRUCache<string, boolean>({
    /**
     * We expect that trades analysis is:
     * - within one day period
     * - for one exchange
     * - for specific trading pair
     *
     * So set it to something reasonably high.
     */
    max: 1000 * 10,
  });
  readonly sampleRate: number;

  constructor(sampleRate = 50) {
    if (sampleRate <= 0 || sampleRate > 100) {
      throw new Error('Sample rate must be positive integer below 100');
    }

    this.sampleRate = sampleRate;
  }

  checkTradeForAbuse(trade: Trade): boolean {
    if (this.tradeIdsSample.has(trade.id)) {
      return true;
    }

    if (_.random(0, 100) < this.sampleRate) {
      this.tradeIdsSample.set(trade.id, true);
    }

    return false;
  }
}
