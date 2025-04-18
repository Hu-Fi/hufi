export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export type TokenData = {
  name: string;
  label?: string;
  icon?: string;
};
