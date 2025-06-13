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
