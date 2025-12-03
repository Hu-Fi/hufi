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

import { ExchangeExtras } from '../api-client';

/**
 * We expect API keys to be <=200 charactes, so after encryption
 * the string should be less than 500 chars. At the same time,
 * API secret key might be RSA 4096, which is 3k+ chars in raw format.
 *
 * Taking the above into account, we provide some reasonably high
 * length limit for DB columns to have some space for manoeuvre.
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

  @Column('varchar', { length: 10000 })
  secretKey: string;

  @Column('jsonb', { nullable: true })
  extras: ExchangeExtras | null;

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
