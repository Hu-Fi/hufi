import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';

import { type CampaignDetails, CampaignStatus, CampaignType } from './types';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'campaigns' })
@Index(['chainId', 'address'], { unique: true })
export class CampaignEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  chainId: number;

  @Column('varchar', { length: 42 })
  address: string;

  @Column({
    type: 'enum',
    enum: CampaignType,
  })
  type: CampaignType;

  @Column('varchar', { length: 20 })
  exchangeName: string;

  @Column('varchar', { length: 20 })
  symbol: string;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 30, scale: 18 })
  fundAmount: string;

  @Column('varchar', { length: 20 })
  fundToken: string;

  @Column('int')
  fundTokenDecimals: number;

  @Column('jsonb')
  details: CampaignDetails;

  @Column({ type: 'timestamptz', nullable: true })
  lastResultsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  resultsCutoffAt: Date | null;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
  })
  status: CampaignStatus;

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
