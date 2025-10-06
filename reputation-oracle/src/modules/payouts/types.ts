import { IEscrow } from '@human-protocol/sdk';

export type BaseCampaignManifest = {
  type: string;
  exchange: string;
  start_date: string;
  end_date: string;
};

export type CampaignWithResults = Required<
  Pick<
    IEscrow,
    | 'chainId'
    | 'address'
    | 'manifest'
    | 'manifestHash'
    | 'intermediateResultsUrl'
    | 'launcher'
  > & {
    fundTokenAddress: string;
    fundTokenDecimals: number;
    fundAmount: number;
  }
>;

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
  reserved_funds: number;
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
  amount: number;
};

export type CalculatedRewardsBatch = {
  id: string;
  rewards: CalculatedReward[];
};

export type FinalResultsMeta = {
  url: string;
  hash: string;
};
