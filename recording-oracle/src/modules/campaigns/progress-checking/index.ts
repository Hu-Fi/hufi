import type { HoldingResult, HoldingMeta } from './holding';
import type { MarketMakingResult, MarketMakingMeta } from './market-making';

export { HoldingProgressChecker } from './holding';
export { MarketMakingProgressChecker } from './market-making';

export type * from './types';
export type ProgressCheckResult = HoldingResult | MarketMakingResult;
export type CampaignProgressMeta = HoldingMeta | MarketMakingMeta;
