import { Injectable } from '@nestjs/common';

import { isValidExchangeName } from '@/common/validators';
import { AesEncryptionService } from '@/modules/encryption';
import { UsersRepository } from '@/modules/users';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import { ExchangeApiKeyNotFoundError } from './exchange-api-key.error';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';

@Injectable()
export class ExchangeApiKeysService {
  constructor(
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly usersRepository: UsersRepository,
    private readonly aesEncryptionService: AesEncryptionService,
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

    const userExists = await this.usersRepository.existsById(userId);
    if (!userExists) {
      throw new Error('422: user does not exist');
    }

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
