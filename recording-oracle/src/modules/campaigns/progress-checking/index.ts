import type { HoldingMeta, HoldingResult } from './holding';
import type { MarketMakingMeta, MarketMakingResult } from './market-making';
import type { ThresholdMeta, ThresholdResult } from './threshold';

export { HoldingProgressChecker } from './holding';
export { MarketMakingProgressChecker } from './market-making';
export { ThresholdProgressChecker } from './threshold';

export type * from './types';
export type { HoldingMeta, MarketMakingMeta, ThresholdMeta };
export type ProgressCheckResult =
  | HoldingResult
  | MarketMakingResult
  | ThresholdResult;
export type CampaignProgressMeta =
  | HoldingMeta
  | MarketMakingMeta
  | ThresholdMeta;
