import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';

@Injectable()
export class ExchangeApiKeysRepository extends Repository<ExchangeApiKeyEntity> {
  constructor(dataSource: DataSource) {
    super(ExchangeApiKeyEntity, dataSource.createEntityManager());
  }

  async listExchangesByUserId(userId: string): Promise<string[]> {
    if (!userId) {
      throw new Error('userId is required');
    }

    const results: Array<Pick<ExchangeApiKeyEntity, 'exchangeName'>> =
      await this.find({
        where: {
          userId,
        },
        select: {
          exchangeName: true,
        },
      });

    return results.map((r) => r.exchangeName);
  }

  async deleteByUserAndExchange(
    userId: string,
    exchangeName: string,
  ): Promise<void> {
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!exchangeName) {
      throw new Error('exchangeName is required');
    }

    await this.delete({ userId, exchangeName });
  }

  async findOneByUserAndExchange(
    userId: string,
    exchangeName: string,
  ): Promise<ExchangeApiKeyEntity | null> {
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!exchangeName) {
      throw new Error('exchangeName is required');
    }

    return this.findOneBy({
      userId,
      exchangeName,
    });
  }
}
