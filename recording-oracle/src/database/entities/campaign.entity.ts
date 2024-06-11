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

  @ManyToMany(() => UserEntity, (user) => user.campaigns)
  users: UserEntity[];

  @OneToMany(
    () => LiquidityScoreEntity,
    (liquidityScore) => liquidityScore.campaign,
  )
  liquidityScores: LiquidityScoreEntity[];
}
