/*
  Internal status of the campaign in recording oracle database.
  Used to simplify queries for results calculation and cancellation.
*/
export enum CampaignStatus {
  ACTIVE = 'active',
  PENDING_CANCELLATION = 'pending_cancellation',
  CANCELLED = 'cancelled',
  PENDING_COMPLETION = 'pending_completion',
  COMPLETED = 'completed',
}

export enum ExposedCampaignStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum CampaignType {
  MARKET_MAKING = 'MARKET_MAKING',
}

export type CampaignManifest = {
  type: string;
  daily_volume_target: number;
  exchange: string;
  pair: string;
  start_date: Date;
  end_date: Date;
};

export type CampaignEscrowInfo = {
  fundAmount: number;
  fundTokenSymbol: string;
};

export type ParticipantOutcome = {
  address: string;
  score: number;
  total_volume: number;
};

export type ParticipantsOutcomesBatch = {
  id: string;
  results: ParticipantOutcome[];
};

export type IntermediateResult = {
  from: string;
  to: string;
  total_volume: number;
  participants_outcomes_batches: ParticipantsOutcomesBatch[];
};

export type IntermediateResultsData = {
  chain_id: number;
  address: string;
  exchange: string;
  pair: string;
  results: IntermediateResult[];
};
