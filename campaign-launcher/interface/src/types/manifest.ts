export type ManifestDto = {
  chainId: number;
  requesterAddress: string;
  exchangeName: string;
  token: string;
  duration: number;
  fundAmount: string;
  startBlock: number;
  endBlock: number;
  type: string;
};
