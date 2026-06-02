import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';

import type { UserPreferencesEntity } from './user-preferences.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 42, unique: true })
  evmAddress: string;

  @Column('varchar', { length: 32 })
  nonce: string;

  @OneToOne(
    'UserPreferencesEntity',
    (preferences: UserPreferencesEntity) => preferences.user,
    { persistence: false },
  )
  preferences?: UserPreferencesEntity;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;
}
