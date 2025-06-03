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

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'exchange_api_keys' })
@Index(['userId', 'exchangeName'], { unique: true })
export class ExchangeApiKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 20 })
  exchangeName: string;

  // TODO: estimate max length when encrypted
  @Column('varchar', { length: 200 })
  apiKey: string;

  // TODO: estimate max length when encrypted
  @Column('varchar', { length: 200 })
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
