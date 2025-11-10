type BaseCampaignManifest = {
  type: string;
  exchange: string;
  start_date: Date;
  end_date: Date;
};

export type HoldingCampaignManifest = BaseCampaignManifest & {
  symbol: string;
  daily_balance_target: number;
};

export type MarketMakingCampaignManifest = BaseCampaignManifest & {
  pair: string;
  daily_volume_target: number;
};

export type ThresholdCampaignManifest = BaseCampaignManifest & {
  symbol: string;
  minimum_balance_target: number;
};

export type CampaignManifest =
  | HoldingCampaignManifest
  | MarketMakingCampaignManifest
  | ThresholdCampaignManifest;

export enum CampaignStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  TO_CANCEL = 'to_cancel',
}

export enum CampaignType {
  MARKET_MAKING = 'MARKET_MAKING',
  HOLDING = 'HOLDING',
  THRESHOLD = 'THRESHOLD',
}
