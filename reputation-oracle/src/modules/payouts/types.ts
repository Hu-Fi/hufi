import { IEscrow } from '@human-protocol/sdk';

export type CampaignWithResults = Required<
  Pick<
    IEscrow,
    | 'chainId'
    | 'address'
    | 'manifestUrl'
    | 'manifestHash'
    | 'intermediateResultsUrl'
  >
>;

export type IntermediateResults = Record<string, unknown>;
