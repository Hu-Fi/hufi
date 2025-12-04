import { Injectable } from '@nestjs/common';

import logger from '@/logger';

import {
  ExchangeApiAccessError,
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
  private readonly logger = logger.child({
    context: ExchangesService.name,
  });

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

  async markApiKeyAsInvalid(
    userId: string,
    exchangeName: string,
    accessError: ExchangeApiAccessError,
  ): Promise<void> {
    try {
      await this.exchangeApiKeysService.markAsInvalid(
        userId,
        exchangeName,
        accessError.cause,
      );
    } catch (error) {
      this.logger.error('Failed to mark exchange api key as invalid', {
        userId,
        exchangeName,
        accessError,
        error,
      });
    }
  }
}
