import { type ExchangeExtras } from '../api-client';

export type ExchangeApiKeyData = {
  id: string;
  apiKey: string;
  secretKey: string;
  extras?: ExchangeExtras;
};
