/*
  Internal status of the campaign in recording oracle database.
  Used to simplify queries for results calculation and cancellation.
*/
export enum CampaignStatus {
  ACTIVE = 'active',
  TO_CANCEL = 'to_cancel',
  PENDING_CANCELLATION = 'pending_cancellation',
  CANCELLED = 'cancelled',
  PENDING_COMPLETION = 'pending_completion',
  COMPLETED = 'completed',
}

export enum ReturnedCampaignStatus {
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

export type MarketMakingCampaignDetails = {
  dailyVolumeTarget: number;
};

export type HoldingCampaignDetails = {
  dailyBalanceTarget: number;
};

export type ThresholdCampaignDetails = {
  minimumBalanceTarget: number;
};

export type CampaignDetails =
  | MarketMakingCampaignDetails
  | HoldingCampaignDetails
  | ThresholdCampaignDetails;

export type CampaignManifestBase = {
  type: string;
  exchange: string;
  start_date: Date;
  end_date: Date;
};

export type MarketMakingCampaignManifest = CampaignManifestBase & {
  type: CampaignType.MARKET_MAKING;
  pair: string;
  daily_volume_target: number;
};

export type HoldingCampaignManifest = CampaignManifestBase & {
  type: CampaignType.HOLDING;
  symbol: string;
  daily_balance_target: number;
};

export type ThresholdCampaignManifest = CampaignManifestBase & {
  type: CampaignType.THRESHOLD;
  symbol: string;
  minimum_balance_target: number;
};

export type CampaignManifest =
  | MarketMakingCampaignManifest
  | HoldingCampaignManifest
  | ThresholdCampaignManifest;

export type CampaignEscrowInfo = {
  fundAmount: number;
  fundTokenSymbol: string;
  fundTokenDecimals: number;
};

export type ParticipantOutcome = {
  address: string;
  score: number;
  [meta: string]: unknown;
};

export type ParticipantsOutcomesBatch = {
  id: string;
  results: ParticipantOutcome[];
};

export type IntermediateResult = {
  from: string;
  to: string;
  reserved_funds: number;
  participants_outcomes_batches: ParticipantsOutcomesBatch[];
  [meta: string]: unknown;
};

export type IntermediateResultsData = {
  chain_id: number;
  address: string;
  exchange: string;
  symbol: string;
  results: IntermediateResult[];
};

export type CampaignProgress<M> = {
  from: string;
  to: string;
  participants_outcomes: ParticipantOutcome[];
  meta: M;
};
