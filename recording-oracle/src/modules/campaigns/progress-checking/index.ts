import type { HoldingMeta, HoldingResult } from './holding';
import type { MarketMakingMeta, MarketMakingResult } from './market-making';
import type { ThresholdMeta, ThresholdResult } from './threshold';
import type {
  ThresholdMarketMakingMeta,
  ThresholdMarketMakingResult,
} from './threshold-market-making';

export { HoldingProgressChecker } from './holding';
export { MarketMakingProgressChecker } from './market-making';
export { ThresholdProgressChecker } from './threshold';
export { ThresholdMarketMakingProgressChecker } from './threshold-market-making';

export type * from './types';
export type {
  HoldingMeta,
  MarketMakingMeta,
  ThresholdMarketMakingMeta,
  ThresholdMeta,
};
export type ProgressCheckResult =
  | HoldingResult
  | MarketMakingResult
  | ThresholdMarketMakingResult
  | ThresholdResult;
export type CampaignProgressMeta =
  | HoldingMeta
  | MarketMakingMeta
  | ThresholdMarketMakingMeta
  | ThresholdMeta;
