import type { ExchangeApiClientInitOptions, Trade } from '@/modules/exchange';

export type ProgressCheckInput = {
  exchangeName: string;
  apiClientOptions: ExchangeApiClientInitOptions;
  pair: string;
  startDate: Date;
  endDate: Date;
};

export type ProgressCheckResult = {
  abuseDetected: boolean;
  score: number;
  totalVolume: number;
};

export interface CampaignProgressChecker {
  check(input: ProgressCheckInput): Promise<ProgressCheckResult>;
  setAbuseDetector(abuseDetectorToUse: AbuseDetector): void;
}

export interface AbuseDetector {
  checkTradeForAbuse(trade: Trade): boolean;
}
