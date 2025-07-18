import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { VolumeStatEntity } from './volume-stat.entity';

@Injectable()
export class VolumeStatsRepository extends Repository<VolumeStatEntity> {
  constructor(dataSource: DataSource) {
    super(VolumeStatEntity, dataSource.createEntityManager());
  }

  async calculateTotalVolume(exchangeName?: string): Promise<number> {
    const totalSumQuery = this.createQueryBuilder('stat').select(
      'COALESCE(SUM(stat.volume), 0)',
      'totalVolume',
    );

    if (exchangeName) {
      totalSumQuery.where('stat.exchange_name = :exchangeName', {
        exchangeName,
      });
    }

    const queryResult = await totalSumQuery.getRawOne();

    return Number(queryResult.totalVolume);
  }
}
