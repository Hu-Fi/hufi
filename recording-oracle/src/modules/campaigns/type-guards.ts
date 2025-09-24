import type { CampaignEntity } from './campaign.entity';
import {
  CampaignType,
  type LiquidityCampaignDetails,
  type VolumeCampaignDetails,
} from './types';

export function isVolumeCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & { details: VolumeCampaignDetails } {
  return campaign.type === CampaignType.VOLUME;
}

export function isLiquidityCampaign(
  campaign: CampaignEntity,
): campaign is CampaignEntity & { details: LiquidityCampaignDetails } {
  return campaign.type === CampaignType.LIQUIDITY;
}
