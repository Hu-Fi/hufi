export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export type Exchange = {
  name: string;
  displayName: string;
  url: string;
  logo: string;
  type: ExchangeType;
};
