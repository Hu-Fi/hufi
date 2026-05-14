import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { UserPreferencesEntity } from './user-preferences.entity';

@Injectable()
export class UserPreferencesRepository extends Repository<UserPreferencesEntity> {
  constructor(dataSource: DataSource) {
    super(UserPreferencesEntity, dataSource.createEntityManager());
  }
}
