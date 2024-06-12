export type Manifest = {
  chainId: number;
  requesterAddress: string;
  exchangeName: string;
  token: string;
  duration: number;
  fundAmount: number;
  startBlock: number;
  endBlock: number;
  type: string;
};
