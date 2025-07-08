import type { ExchangeApiClientInitOptions } from '@/modules/exchange';

export type ProgressCheckInput = {
  exchangeName: string;
  apiClientOptions: ExchangeApiClientInitOptions;
  pair: string;
  startDate: Date;
  endDate: Date;
};

export type MarketMakingResult = {
  score: number;
  totalVolume: number;
};

export type ProgressCheckResult = MarketMakingResult;

export interface CampaignProgressChecker {
  check(input: ProgressCheckInput): Promise<ProgressCheckResult>;
}
