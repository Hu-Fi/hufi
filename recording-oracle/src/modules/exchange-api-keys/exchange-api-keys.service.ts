import { Injectable } from '@nestjs/common';

import { UsersRepository } from '@/modules/users';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';

@Injectable()
export class ExchangeApiKeysService {
  constructor(
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async enroll(input: {
    userId: string;
    exchangeName: string;
    apiKey: string;
    secretKey: string;
  }): Promise<ExchangeApiKeyEntity> {
    const { userId, exchangeName, apiKey, secretKey } = input;

    const userExists = await this.usersRepository.existsById(userId);
    if (!userExists) {
      throw new Error('422: user does not exist');
    }

    const enrolledKey = new ExchangeApiKeyEntity();
    enrolledKey.userId = userId;
    enrolledKey.exchangeName = exchangeName;
    enrolledKey.apiKey = apiKey;
    enrolledKey.secretKey = secretKey;
    enrolledKey.updatedAt = new Date();

    await this.exchangeApiKeysRepository.upsert(enrolledKey, [
      'userId',
      'exchangeName',
    ]);

    return enrolledKey;
  }
}
