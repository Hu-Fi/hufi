import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import type { UserEntity } from '@/modules/users';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'refresh_tokens' })
@Index(['userId'], { unique: true })
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('UserEntity', { persistence: false, onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column()
  userId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
