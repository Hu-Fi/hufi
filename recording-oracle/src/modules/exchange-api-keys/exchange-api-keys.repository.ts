import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';

@Injectable()
export class ExchangeApiKeysRepository extends Repository<ExchangeApiKeyEntity> {
  constructor(dataSource: DataSource) {
    super(ExchangeApiKeyEntity, dataSource.createEntityManager());
  }

  async listExchangesByUserId(userId: string): Promise<string[]> {
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

  async deleteByExchangeAndUser(
    userId: string,
    exchangeName: string,
  ): Promise<void> {
    await this.delete({ userId, exchangeName });
  }
}
