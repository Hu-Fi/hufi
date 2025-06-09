import { Injectable } from '@nestjs/common';

import { isValidExchangeName } from '@/common/validators';
import { AesEncryptionService } from '@/modules/encryption';
import { UsersService } from '@/modules/users';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import {
  ExchangeApiKeyNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
} from './exchange-api-key.error';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiClientFactory } from '../exchange/exchange-api-client-factory';

@Injectable()
export class ExchangeApiKeysService {
  constructor(
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly userService: UsersService,
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

    await this.userService.assertUserExistsById(userId);

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
  ): Promise<{ apiKey: string; secretKey: string }> {
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
      apiKey: decryptedApiKey.toString(),
      secretKey: decryptedSecretKey.toString(),
    };
  }
}
