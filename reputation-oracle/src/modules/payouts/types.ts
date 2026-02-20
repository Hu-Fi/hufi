import type { IEscrow } from '@human-protocol/sdk';

export enum CampaignType {
  MARKET_MAKING = 'MARKET_MAKING',
  COMPETITIVE_MARKET_MAKING = 'COMPETITIVE_MARKET_MAKING',
  HOLDING = 'HOLDING',
  THRESHOLD = 'THRESHOLD',
}

export type BaseCampaignManifest = {
  type: CampaignType;
  exchange: string;
  start_date: string;
  end_date: string;
};

export type CompetitiveCampaignManifest = BaseCampaignManifest & {
  type: CampaignType.COMPETITIVE_MARKET_MAKING;
  pair: string;
  rewards_distribution: number[];
};

export type MarketMakingCampaignManifest = BaseCampaignManifest & {
  type: CampaignType.MARKET_MAKING;
  pair: string;
  daily_volume_target: number;
};

export type HoldingCampaignManifest = BaseCampaignManifest & {
  type: CampaignType.HOLDING;
  symbol: string;
  daily_balance_target: number;
};

export type ThresholdCampaignManifest = BaseCampaignManifest & {
  type: CampaignType.THRESHOLD;
  symbol: string;
  minimum_balance_target: number;
};

export type CampaignManifest =
  | MarketMakingCampaignManifest
  | CompetitiveCampaignManifest
  | HoldingCampaignManifest
  | ThresholdCampaignManifest;

export type CampaignWithResults = Pick<
  IEscrow,
  | 'chainId'
  | 'address'
  | 'status'
  | 'launcher'
  | 'intermediateResultsUrl'
  | 'intermediateResultsHash'
> & {
  manifest: string;
  manifestHash: string;
  fundTokenAddress: string;
  fundTokenDecimals: number;
  fundAmount: number;
};

export type ParticipantOutcome = {
  address: string;
  score: number;
  total_volume?: number;
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

export type CalculatedReward = {
  address: string;
  amount: string;
};

export type CalculatedRewardsBatch = {
  id: string;
  rewards: CalculatedReward[];
};

export type FinalResultsMeta = {
  url: string;
  hash: string;
};
