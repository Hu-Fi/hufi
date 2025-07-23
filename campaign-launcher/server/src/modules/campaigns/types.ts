export type CampaignManifest = {
  type: string;
  daily_volume_target: number;
  exchange: string;
  pair: string;
  fund_token: string;
  start_date: Date;
  end_date: Date;
};
