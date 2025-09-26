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

export enum ReturnedCampaignStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum CampaignType {
  VOLUME = 'VOLUME',
  LIQUIDITY = 'LIQUIDITY',
}

export type VolumeCampaignDetails = {
  dailyVolumeTarget: number;
};

export type LiquidityCampaignDetails = {
  dailyBalanceTarget: number;
};

export type CampaignDetails = VolumeCampaignDetails | LiquidityCampaignDetails;

export type CampaignManifestBase = {
  type: string;
  exchange: string;
  symbol: string;
  start_date: Date;
  end_date: Date;
};

export type VolumeCampaignManifest = CampaignManifestBase & {
  type: CampaignType.VOLUME;
  daily_volume_target: number;
};

export type LiquidityCampaignManifest = CampaignManifestBase & {
  type: CampaignType.LIQUIDITY;
  daily_balance_target: number;
};

export type CampaignManifest =
  | VolumeCampaignManifest
  | LiquidityCampaignManifest;

export type CampaignEscrowInfo = {
  fundAmount: number;
  fundTokenSymbol: string;
  fundTokenDecimals: number;
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
  reserved_funds: number;
  participants_outcomes_batches: ParticipantsOutcomesBatch[];
  total_volume: number;
};

export type IntermediateResultsData = {
  chain_id: number;
  address: string;
  exchange: string;
  symbol: string;
  results: IntermediateResult[];
};

export type CampaignProgress = {
  from: string;
  to: string;
  total_volume: number;
  participants_outcomes: ParticipantOutcome[];
};
