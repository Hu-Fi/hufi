import { Injectable } from '@nestjs/common';

import logger from '@/logger';

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

  async revalidateApiKey(userId: string, exchangeName: string): Promise<void> {
    try {
      const exchangeApiClient = await this.getClientForUser(
        userId,
        exchangeName,
      );

      const hasRequiredAccess = await exchangeApiClient.checkRequiredAccess(
        Object.values(ExchangePermission),
      );

      if (!hasRequiredAccess.success) {
        await this.exchangeApiKeysService.markAsInvalid(
          userId,
          exchangeName,
          hasRequiredAccess.missing,
        );
      }
    } catch (error) {
      this.logger.error('Failed to revalidate exchange api key', {
        userId,
        exchangeName,
        error,
      });
    }
  }
}
