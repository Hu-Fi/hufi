import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'volume_stats' })
@Index(['exchangeName', 'campaignAddress', 'periodStart'], { unique: true })
export class VolumeStatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 42 })
  campaignAddress: string;

  @Column('varchar', { length: 20 })
  exchangeName: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  volume: number;

  @Column({ type: 'timestamptz' })
  periodStart: Date;

  @Column({ type: 'timestamptz' })
  periodEnd: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  recordedAt: Date;
}
