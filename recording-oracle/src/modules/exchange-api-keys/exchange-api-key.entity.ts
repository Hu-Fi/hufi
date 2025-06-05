import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import { UserEntity } from '@/modules/users';

/**
 * We expect keys to be <=200 charactes, so after encryption
 * the string should be less than 500 chars. However,
 * we provide some reasonably high length limit for DB column
 * to have some space for manoeuvre.
 */

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'exchange_api_keys' })
@Index(['userId', 'exchangeName'], { unique: true })
export class ExchangeApiKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 20 })
  exchangeName: string;

  @Column('varchar', { length: 1000 })
  apiKey: string;

  @Column('varchar', { length: 1000 })
  secretKey: string;

  @ManyToOne('UserEntity', { persistence: false, onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column()
  userId: string;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  protected beforeInsert(): void {
    this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  @BeforeUpdate()
  protected beforeUpdate(): void {
    this.updatedAt = new Date();
  }
}
