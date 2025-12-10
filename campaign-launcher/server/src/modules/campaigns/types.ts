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

export type ParticipantOutcome = {
  address: string;
  score: number;
};

export type ParticipantsOutcomesBatch = {
  id: string;
  results: ParticipantOutcome[];
};

export type IntermediateResult = {
  from: Date;
  to: Date;
  reserved_funds: string | number;
  participants_outcomes_batches: ParticipantsOutcomesBatch[];
};

export type IntermediateResultsData = {
  chain_id: number;
  address: string;
  exchange: string;
  results: IntermediateResult[];
};
