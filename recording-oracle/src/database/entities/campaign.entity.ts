import { Entity, Column, ManyToMany, OneToMany, Index } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../base.entity';

import { LiquidityScoreEntity } from './liquidity-score.entity';
import { UserEntity } from './user.entity';

@Entity({ schema: NS, name: 'campaigns' })
@Index(['chainId', 'address'], { unique: true })
export class CampaignEntity extends BaseEntity {
  @Column()
  chainId: number; // Chain ID of the campaign

  @Column()
  address: string; // Address of the campaign

  @Column({
    nullable: true,
  })
  exchangeName: string | null; // Name of the exchange

  @Column({
    nullable: true,
  })
  token: string | null; // Token used in the campaign

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  startDate: Date | null; // Start date of the campaign

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  endDate: Date | null; // End date of the campaign

  @Column({
    nullable: true,
  })
  fundToken: string | null; // Fund token of the campaign

  @Column({
    nullable: true,
  })
  fundAmount: string | null; // Fund amount of the campaign

  @Column({
    type: 'timestamp',
    default: () => 'now()',
  })
  lastSyncedAt: Date; // Last synced timestamp

  @ManyToMany(() => UserEntity, (user) => user.campaigns)
  users: UserEntity[];

  @OneToMany(
    () => LiquidityScoreEntity,
    (liquidityScore) => liquidityScore.campaign,
  )
  liquidityScores: LiquidityScoreEntity[];
}
