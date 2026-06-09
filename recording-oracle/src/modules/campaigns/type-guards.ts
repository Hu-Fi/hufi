import { CampaignType } from '@/common/constants';

import type { CampaignEntity } from './campaign.entity';
import {
  type CompetitiveMarketMakingCampaignDetails,
  type ThresholdMarketMakingCampaignDetails,
  type HoldingCampaignDetails,
  type MarketMakingCampaignDetails,
  type ThresholdCampaignDetails,
} from './types';

export function isMarketMakingCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & { details: MarketMakingCampaignDetails } {
  return campaign.type === CampaignType.MARKET_MAKING;
}

export function isCompetitiveMarketMakingCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & {
  details: CompetitiveMarketMakingCampaignDetails;
} {
  return campaign.type === CampaignType.COMPETITIVE_MARKET_MAKING;
}

export function isThresholdMarketMakingCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & {
  details: ThresholdMarketMakingCampaignDetails;
} {
  return campaign.type === CampaignType.THRESHOLD_MARKET_MAKING;
}

export function isVolumeBasedCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity &
  (
    | { details: MarketMakingCampaignDetails }
    | { details: CompetitiveMarketMakingCampaignDetails }
    | { details: ThresholdMarketMakingCampaignDetails }
  ) {
  return [
    CampaignType.MARKET_MAKING,
    CampaignType.COMPETITIVE_MARKET_MAKING,
    CampaignType.THRESHOLD_MARKET_MAKING,
  ].includes(campaign.type);
}

export function isHoldingCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & { details: HoldingCampaignDetails } {
  return campaign.type === CampaignType.HOLDING;
}

export function isThresholdCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & { details: ThresholdCampaignDetails } {
  return campaign.type === CampaignType.THRESHOLD;
}

export function isBalanceBasedCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity &
  (
    | { details: HoldingCampaignDetails }
    | { details: ThresholdCampaignDetails }
  ) {
  return [CampaignType.HOLDING, CampaignType.THRESHOLD].includes(campaign.type);
}

export function isThresholdBasedCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity &
  (
    | { details: ThresholdMarketMakingCampaignDetails }
    | { details: ThresholdCampaignDetails }
  ) {
  return (
    campaign.type === CampaignType.THRESHOLD_MARKET_MAKING ||
    campaign.type === CampaignType.THRESHOLD
  );
}
