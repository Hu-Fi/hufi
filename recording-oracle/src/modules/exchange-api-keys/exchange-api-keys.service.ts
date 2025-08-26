import { Injectable } from '@nestjs/common';

import { isValidExchangeName } from '@/common/validators';
import { AesEncryptionService } from '@/modules/encryption';
import { ExchangeApiClientFactory } from '@/modules/exchange';
import { UsersService } from '@/modules/users';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import { EnrolledApiKeyDto } from './exchange-api-keys.dto';
import {
  ExchangeApiKeyNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
} from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';

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
  }): Promise<ExchangeApiKeyEntity> {
    const { userId, exchangeName, apiKey, secretKey } = input;

    if (!userId || !apiKey || !secretKey) {
      throw new Error('Invalid arguments');
    }

    if (!isValidExchangeName(exchangeName)) {
      throw new Error('Exchange name is not valid');
    }

    const exchangeApiClient = this.exchangeApiClientFactory.create(
      exchangeName,
      { apiKey, secret: secretKey },
    );

    if (!exchangeApiClient.checkRequiredCredentials()) {
      throw new IncompleteKeySuppliedError(exchangeName);
    }

    const hasRequiredAccess = await exchangeApiClient.checkRequiredAccess();
    if (!hasRequiredAccess) {
      throw new KeyAuthorizationError(exchangeName);
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
  ): Promise<{ id: string; apiKey: string; secretKey: string }> {
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
    };
  }

  async assertUserHasAuthorizedKeys(
    userId: string,
    exchangeName: string,
  ): Promise<string> {
    const { id, apiKey, secretKey } = await this.retrieve(userId, exchangeName);

    const exchangeApiClient = this.exchangeApiClientFactory.create(
      exchangeName,
      { apiKey, secret: secretKey },
    );

    const hasRequiredAccess = await exchangeApiClient.checkRequiredAccess();
    if (!hasRequiredAccess) {
      throw new KeyAuthorizationError(exchangeName);
    }

    return id;
  }

  async retrievedEnrolledApiKeys(userId: string): Promise<EnrolledApiKeyDto[]> {
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
        };
      };

      retrievalPromises.push(retrieveFn());
    }

    return await Promise.all(retrievalPromises);
  }
}
