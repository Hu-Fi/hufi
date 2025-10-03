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

export type CampaignManifest =
  | HoldingCampaignManifest
  | MarketMakingCampaignManifest;

export enum CampaignStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export type CampaignOracleFees = {
  exchangeOracleFee: number;
  recordingOracleFee: number;
  reputationOracleFee: number;
};

export enum CampaignType {
  MARKET_MAKING = 'MARKET_MAKING',
  HOLDING = 'HOLDING',
}
