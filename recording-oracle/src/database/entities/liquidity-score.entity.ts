import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../base.entity';

import { CampaignEntity } from './campaign.entity';
import { UserEntity } from './user.entity';

@Entity({ schema: NS, name: 'liquidity-scores' })
@Unique('uq_liquidity_scores_campaign_user_window', [
  'campaignId',
  'userId',
  'windowStart',
])
export class LiquidityScoreEntity extends BaseEntity {
  /* ─────────── Foreign-key columns ─────────── */

  @Column({ name: 'campaign_id' })
  campaignId: string;

  @ManyToOne(() => CampaignEntity, (c) => c.liquidityScores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: CampaignEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, (u) => u.liquidityScores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /* ─────────── Window columns ─────────── */

  @Column({ name: 'window_start', type: 'timestamptz' })
  windowStart: Date;

  @Column({ name: 'window_end', type: 'timestamptz' })
  windowEnd: Date;

  /* ─────────── Score and bookkeeping ─────────── */

  @Column({ name: 'score', type: 'double precision' })
  score: number;

  @Column({ name: 'calculated_at', type: 'timestamptz' })
  calculatedAt: Date;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    onUpdate: 'NOW()',
  })
  updatedAt: Date;
}
