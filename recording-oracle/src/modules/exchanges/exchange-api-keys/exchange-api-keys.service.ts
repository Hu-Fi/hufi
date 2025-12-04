import { Injectable } from '@nestjs/common';

import { isValidExchangeName } from '@/common/validators';
import { AesEncryptionService } from '@/modules/encryption';
import { UsersService } from '@/modules/users';

import {
  ExchangeApiClientFactory,
  ExchangePermission,
  type ExchangeExtras,
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
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly usersService: UsersService,
    private readonly aesEncryptionService: AesEncryptionService,
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
  ) {}

  async enroll(input: {
    userId: string;
    exchangeName: string;
    apiKey: string;
    secretKey: string;
    extras?: ExchangeExtras;
  }): Promise<ExchangeApiKeyEntity> {
    const { userId, exchangeName, apiKey, secretKey, extras } = input;

    if (!userId || !apiKey || !secretKey) {
      throw new Error('Invalid arguments');
    }

    if (!isValidExchangeName(exchangeName)) {
      throw new Error('Exchange name is not valid');
    }

    const exchangeApiClient = this.exchangeApiClientFactory.create(
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

  async markAsInvalid(
    userId: string,
    exchangeName: string,
    missingPermissions: ExchangePermission[],
  ): Promise<void> {
    if (!missingPermissions.length) {
      throw new Error('At least one missing permission must be provided');
    }

    const entity =
      await this.exchangeApiKeysRepository.findOneByUserAndExchange(
        userId,
        exchangeName,
      );

    if (!entity) {
      throw new ExchangeApiKeyNotFoundError(userId, exchangeName);
    }

    entity.isValid = false;
    entity.missingPermissions = Array.from(new Set(missingPermissions));

    await this.exchangeApiKeysRepository.save(entity);
  }
}
