type BaseCampaignManifest = {
  type: string;
  exchange: string;
  symbol: string;
  start_date: Date;
  end_date: Date;
};

export type LiquidityCampaignManifest = BaseCampaignManifest & {
  daily_balance_target: number;
};

export type VolumeCampaignManifest = BaseCampaignManifest & {
  daily_volume_target: number;
};

export type CampaignManifest =
  | LiquidityCampaignManifest
  | VolumeCampaignManifest;

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
  VOLUME = 'VOLUME',
  LIQUIDITY = 'LIQUIDITY',
}
