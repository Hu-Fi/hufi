import { Injectable } from '@nestjs/common';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangesConfigService } from '@/config';
import { AesEncryptionService } from '@/modules/encryption';
import { UsersService } from '@/modules/users';

import {
  ExchangeApiClientFactory,
  ExchangePermission,
  type ExchangeExtras,
  type RequiredAccessCheckResult,
} from '../api-client';
import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import { EnrolledApiKeyDto } from './exchange-api-keys.dto';
import {
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
} from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeyData } from './types';

@Injectable()
export class ExchangeApiKeysService {
  constructor(
    private readonly exchangesConfigService: ExchangesConfigService,
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly usersService: UsersService,
    private readonly aesEncryptionService: AesEncryptionService,
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
  ) {}

  async enroll(input: {
    userId: string;
    exchangeName: ExchangeName;
    apiKey: string;
    secretKey: string;
    extras?: ExchangeExtras;
  }): Promise<ExchangeApiKeyEntity> {
    const { userId, exchangeName, apiKey, secretKey, extras } = input;

    if (!userId || !apiKey || !secretKey) {
      throw new Error('Invalid arguments');
    }

    const exchangeConfig =
      this.exchangesConfigService.configByExchange[exchangeName];
    if (exchangeConfig.type !== ExchangeType.CEX) {
      throw new Error('Only CEX exchanges support API keys');
    }

    const exchangeApiClient = this.exchangeApiClientFactory.createCex(
      exchangeName,
      {
        apiKey,
        secret: secretKey,
        extras,
        userId,
      },
    );

    const accessCheckResult = await exchangeApiClient.checkRequiredAccess(
      Object.values(ExchangePermission),
    );
    if (!accessCheckResult.success) {
      throw new KeyAuthorizationError(exchangeName, accessCheckResult.missing);
    }

    await this.usersService.assertUserExistsById(userId);

    const enrolledKey = new ExchangeApiKeyEntity();
    enrolledKey.userId = userId;
    enrolledKey.exchangeName = exchangeName;

    const [encryptedApiKey, encryptedSecretKey] = await Promise.all([
      this.aesEncryptionService.encrypt(Buffer.from(apiKey)),
      this.aesEncryptionService.encrypt(Buffer.from(secretKey)),
    ]);
    enrolledKey.apiKey = encryptedApiKey;
    enrolledKey.secretKey = encryptedSecretKey;
    enrolledKey.extras = extras ?? null;
    enrolledKey.isValid = true;
    enrolledKey.missingPermissions = [];
    enrolledKey.updatedAt = new Date();

    await this.exchangeApiKeysRepository.upsert(enrolledKey, [
      'userId',
      'exchangeName',
    ]);

    return enrolledKey;
  }

  async retrieve(
    userId: string,
    exchangeName: string,
  ): Promise<ExchangeApiKeyData> {
    const entity =
      await this.exchangeApiKeysRepository.findOneByUserAndExchange(
        userId,
        exchangeName,
      );
    if (!entity) {
      throw new ExchangeApiKeyNotFoundError(userId, exchangeName);
    }

    const [decryptedApiKey, decryptedSecretKey] = await Promise.all([
      this.aesEncryptionService.decrypt(entity.apiKey),
      this.aesEncryptionService.decrypt(entity.secretKey),
    ]);

    return {
      id: entity.id,
      apiKey: decryptedApiKey.toString(),
      secretKey: decryptedSecretKey.toString(),
      extras: entity.extras ?? undefined,
      isValid: entity.isValid,
      missingPermissions: entity.missingPermissions,
    };
  }

  async retrieveEnrolledApiKeys(userId: string): Promise<EnrolledApiKeyDto[]> {
    const enrolledKeys =
      await this.exchangeApiKeysRepository.findByUserId(userId);

    const retrievalPromises: Array<Promise<EnrolledApiKeyDto>> = [];
    for (const enrolledKey of enrolledKeys) {
      const retrieveFn = async () => {
        const decodedApiKey = await this.aesEncryptionService.decrypt(
          enrolledKey.apiKey,
        );

        return {
          exchangeName: enrolledKey.exchangeName,
          apiKey: decodedApiKey.toString(),
          extras: enrolledKey.extras === null ? undefined : enrolledKey.extras,
          isValid: enrolledKey.isValid,
          missingPermissions: enrolledKey.missingPermissions,
        };
      };

      retrievalPromises.push(retrieveFn());
    }

    return await Promise.all(retrievalPromises);
  }

  async markValidity(
    userId: string,
    exchangeName: string,
    missingPermissions: ExchangePermission[] = [],
  ): Promise<void> {
    const entity =
      await this.exchangeApiKeysRepository.findOneByUserAndExchange(
        userId,
        exchangeName,
      );

    if (!entity) {
      throw new ExchangeApiKeyNotFoundError(userId, exchangeName);
    }

    entity.isValid = missingPermissions.length === 0;
    /**
     * Just a safety belt in case method is misused with duplicated values
     */
    entity.missingPermissions = Array.from(new Set(missingPermissions));

    await this.exchangeApiKeysRepository.save(entity);
  }

  async revalidate(
    userId: string,
    exchangeName: string,
  ): Promise<RequiredAccessCheckResult> {
    const { apiKey, secretKey, extras } = await this.retrieve(
      userId,
      exchangeName,
    );

    const exchangeApiClient = this.exchangeApiClientFactory.createCex(
      exchangeName as ExchangeName,
      {
        apiKey,
        secret: secretKey,
        extras,
        userId,
      },
    );

    const accessCheckResult = await exchangeApiClient.checkRequiredAccess(
      Object.values(ExchangePermission),
    );

    await this.markValidity(
      userId,
      exchangeName,
      accessCheckResult.success ? [] : accessCheckResult.missing,
    );

    return accessCheckResult;
  }
}
