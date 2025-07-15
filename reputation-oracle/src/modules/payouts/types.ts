import { IEscrow } from '@human-protocol/sdk';

export type CampaignManifest = {
  type: string;
  daily_volume_target: number;
  exchange: string;
  pair: string;
  fund_token: string;
  start_date: string;
  end_date: string;
};

export type CampaignWithResults = Required<
  Pick<
    IEscrow,
    | 'chainId'
    | 'address'
    | 'manifestUrl'
    | 'manifestHash'
    | 'intermediateResultsUrl'
  > & {
    fundTokenAddress: string;
    fundTokenDecimals: number;
    fundAmount: number;
  }
>;

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
  from: Date;
  to: Date;
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

export type CalculatedReward = {
  address: string;
  amount: number;
};

export type CalculatedRewardsBatch = {
  id: string;
  rewards: CalculatedReward[];
};
