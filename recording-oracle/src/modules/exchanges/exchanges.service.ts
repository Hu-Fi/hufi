import { Injectable } from '@nestjs/common';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangesConfigService } from '@/config';
import logger from '@/logger';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
  ExchangePermission,
  RequiredAccessCheckResult,
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
    private readonly exchangesConfigService: ExchangesConfigService,
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

  async assertUserHasRequiredAccess(
    userId: string,
    exchangeName: ExchangeName,
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<void> {
    const exchangeConfig =
      this.exchangesConfigService.configByExchange[exchangeName];
    if (exchangeConfig.type === ExchangeType.DEX) {
      return;
    }

    const exchangeApiClient = await this.getClientForUser(userId, exchangeName);

    const accessCheckResult =
      await exchangeApiClient.checkRequiredAccess(permissionsToCheck);
    if (!accessCheckResult.success) {
      await this.exchangeApiKeysService.markValidity(
        userId,
        exchangeName,
        accessCheckResult.missing,
      );
      throw new KeyAuthorizationError(exchangeName, accessCheckResult.missing);
    }
  }

  async safeRevalidateApiKey(
    userId: string,
    exchangeName: string,
  ): Promise<RequiredAccessCheckResult | undefined> {
    try {
      return await this.exchangeApiKeysService.revalidate(userId, exchangeName);
    } catch (error) {
      this.logger.error('Failed to revalidate exchange api key', {
        userId,
        exchangeName,
        error,
      });
    }
  }
}
