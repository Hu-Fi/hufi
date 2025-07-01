import { Injectable } from '@nestjs/common';

import { ExchangeApiClientFactory } from '@/modules/exchange';

import type { CampaignProgressChecker } from './types';

@Injectable()
export class MarketMakingResultsChecker implements CampaignProgressChecker {
  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
  ) {}

  async check(input: unknown): Promise<unknown> {
    console.log('Check market making for campaign', input);
    return { e2e: 'check' };
  }
}
