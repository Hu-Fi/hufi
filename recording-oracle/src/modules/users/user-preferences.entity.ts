import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';

import type {
  CampaignsAutojoinPreferences,
  NotificationsPreferences,
} from './types';
import type { UserEntity } from './user.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'user_preferences' })
export class UserPreferencesEntity {
  @OneToOne('UserEntity', (user: UserEntity) => user.preferences, {
    persistence: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user?: UserEntity;

  @PrimaryColumn()
  userId: string;

  @Column('jsonb')
  campaignsAutojoin: CampaignsAutojoinPreferences;

  @Column('jsonb')
  notifications: NotificationsPreferences;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;
}
