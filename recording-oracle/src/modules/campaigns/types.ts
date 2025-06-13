/*
    Internal status of the campaign in recording oracle database.
    Used to simplify queries for results calculation and cancellation.
*/
export enum CampaignStatus {
  ACTIVE = 'active',
  PENDING_CANCELLATION = 'pending_cancellation',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export type CampaignManifest = {
  exchange: string;
  pair: string;
  fund_token: string;
  start_date: Date;
  end_date: Date;
};
