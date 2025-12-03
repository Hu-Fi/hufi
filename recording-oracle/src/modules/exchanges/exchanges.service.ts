import { Injectable } from '@nestjs/common';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
  ExchangePermission,
} from './api-client';
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
    const { apiKey, secretKey, extras } =
      await this.exchangeApiKeysService.retrieve(userId, exchangeName);

    const exchangeApiClient = this.exchangeApiClientFactory.create(
      exchangeName,
      {
        apiKey,
        secret: secretKey,
        extras,
        userId,
      },
    );

    return exchangeApiClient;
  }

  async assertUserHasAuthorizedKeys(
    userId: string,
    exchangeName: string,
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<void> {
    const exchangeApiClient = await this.getClientForUser(userId, exchangeName);

    const hasRequiredAccess =
      await exchangeApiClient.checkRequiredAccess(permissionsToCheck);
    if (!hasRequiredAccess.success) {
      throw new KeyAuthorizationError(exchangeName, hasRequiredAccess.missing);
    }
  }
}
