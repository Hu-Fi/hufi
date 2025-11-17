import { Injectable } from '@nestjs/common';

import { ExchangeApiClient, ExchangeApiClientFactory } from './api-client';
import {
  ExchangeApiKeysService,
  KeyAuthorizationError,
} from './exchange-api-keys';

@Injectable()
export class ExchangesService {
  constructor(
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
    private readonly exchangeApiKeysService: ExchangeApiKeysService,
  ) {}

  async getClientForUser(
    userId: string,
    exchangeName: string,
  ): Promise<ExchangeApiClient> {
    const { apiKey, secretKey } = await this.exchangeApiKeysService.retrieve(
      userId,
      exchangeName,
    );

    const exchangeApiClient = this.exchangeApiClientFactory.create(
      exchangeName,
      {
        apiKey,
        secret: secretKey,
      },
    );

    return exchangeApiClient;
  }

  async assertUserHasAuthorizedKeys(
    userId: string,
    exchangeName: string,
  ): Promise<void> {
    const exchangeApiClient = await this.getClientForUser(userId, exchangeName);

    const hasRequiredAccess = await exchangeApiClient.checkRequiredAccess();
    if (!hasRequiredAccess) {
      throw new KeyAuthorizationError(exchangeName);
    }
  }
}
