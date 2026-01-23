import { Injectable } from '@nestjs/common';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangeNotSupportedError } from '@/common/errors/exchanges';
import { ExchangesConfigService } from '@/config';
import logger from '@/logger';
import { UserNotFoundError, UsersRepository } from '@/modules/users';

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
    private readonly usersRepository: UsersRepository,
  ) {}

  async getClientForUser(
    userId: string,
    exchangeName: string,
  ): Promise<ExchangeApiClient> {
    if (!this.exchangesConfigService.isExchangeSupported(exchangeName)) {
      throw new ExchangeNotSupportedError(exchangeName);
    }
    const exchangeConfig =
      this.exchangesConfigService.configByExchange[exchangeName];

    switch (exchangeConfig.type) {
      case ExchangeType.CEX: {
        const { apiKey, secretKey, extras } =
          await this.exchangeApiKeysService.retrieve(userId, exchangeName);

        return this.exchangeApiClientFactory.createCex(exchangeName, {
          apiKey,
          secret: secretKey,
          extras,
          userId,
        });
      }
      case ExchangeType.DEX: {
        const user = await this.usersRepository.findOneById(userId);
        if (!user) {
          throw new UserNotFoundError(userId);
        }

        return this.exchangeApiClientFactory.createDex(exchangeName, {
          userId,
          userEvmAddress: user.evmAddress,
        });
      }
      default:
        throw new Error(`Exchange type not supported: ${exchangeConfig.type}`);
    }
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
