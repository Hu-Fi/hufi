import * as ccxt from 'ccxt';
import type { Exchange } from 'ccxt';

import logger from '@/logger';
import type { Logger } from '@/logger';

import { ExchangeApiClientError } from './errors';
import { ExchangeApiClient } from './types';

type InitOptions = {
  apiKey: string;
  secret: string;
  sandbox?: boolean;
};

export class CcxtExchangeClient implements ExchangeApiClient {
  private logger: Logger;
  private ccxtClient: Exchange;

  constructor(
    readonly exchangeName: string,
    { apiKey, secret, sandbox }: InitOptions,
  ) {
    if (!(exchangeName in ccxt)) {
      throw new Error(`Exchange not supported: ${exchangeName}`);
    }

    const exchangeClass = ccxt[exchangeName];
    this.ccxtClient = new exchangeClass({ apiKey, secret });

    const _sandbox = Boolean(sandbox);
    if (_sandbox) {
      this.ccxtClient.setSandboxMode(true);
    }

    this.logger = logger.child({
      context: CcxtExchangeClient.name,
      exchangeName,
      sandbox: _sandbox,
    });
  }

  checkRequiredCredentials(): boolean {
    return this.ccxtClient.checkRequiredCredentials(false);
  }

  async checkRequiredAccess(): Promise<boolean> {
    try {
      await this.ccxtClient.fetchBalance();
      return true;
    } catch (error) {
      if (error instanceof ccxt.NetworkError) {
        const message = 'Error while checking exchange access';
        this.logger.error(message, error);
        throw new ExchangeApiClientError(message);
      }

      return false;
    }
  }
}
