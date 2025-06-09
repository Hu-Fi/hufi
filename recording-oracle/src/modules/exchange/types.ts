export type Trade = {
  id: string;
};

export type ExchangeApiClientInitOptions = {
  apiKey: string;
  secret: string;
};

export interface ExchangeApiClient {
  readonly exchangeName: string;

  checkRequiredCredentials(): boolean;

  checkRequiredAccess(): Promise<boolean>;
}
