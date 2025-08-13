export type CampaignManifest = {
  type: string;
  daily_volume_target: number;
  exchange: string;
  pair: string;
  fund_token: string;
  start_date: Date;
  end_date: Date;
};

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
