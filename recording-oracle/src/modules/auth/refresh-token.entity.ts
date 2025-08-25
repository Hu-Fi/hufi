import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import type { UserEntity } from '@/modules/users';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'refresh_tokens' })
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @OneToOne('UserEntity', { persistence: false, onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column()
  userId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
