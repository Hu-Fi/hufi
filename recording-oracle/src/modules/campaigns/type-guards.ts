import type { CampaignEntity } from './campaign.entity';
import {
  CampaignType,
  type HoldingCampaignDetails,
  type MarketMakingCampaignDetails,
} from './types';

export function isMarketMakingCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & { details: MarketMakingCampaignDetails } {
  return campaign.type === CampaignType.MARKET_MAKING;
}

export function isHoldingCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & { details: HoldingCampaignDetails } {
  return campaign.type === CampaignType.HOLDING;
}
