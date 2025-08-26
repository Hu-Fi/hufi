import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { VolumeStatEntity } from './volume-stat.entity';

@Injectable()
export class VolumeStatsRepository extends Repository<VolumeStatEntity> {
  constructor(dataSource: DataSource) {
    super(VolumeStatEntity, dataSource.createEntityManager());
  }
}
