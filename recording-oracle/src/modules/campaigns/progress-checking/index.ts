import type { HoldingResult, HoldingMeta } from './holding';
import type { MarketMakingResult, MarketMakingMeta } from './market-making';
import type { ThresholdResult, ThresholdMeta } from './threshold';

export { HoldingProgressChecker } from './holding';
export { MarketMakingProgressChecker } from './market-making';
export { ThresholdProgressChecker } from './threshold';

export type * from './types';
export type ProgressCheckResult =
  | HoldingResult
  | MarketMakingResult
  | ThresholdResult;
export type CampaignProgressMeta =
  | HoldingMeta
  | MarketMakingMeta
  | ThresholdMeta;
export type { HoldingMeta, MarketMakingMeta, ThresholdMeta };
