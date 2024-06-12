import { Entity, Column, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../base.entity';

import { CampaignEntity } from './campaign.entity';
import { UserEntity } from './user.entity';

@Entity({ schema: NS, name: 'liquidity-scores' })
export class LiquidityScoreEntity extends BaseEntity {
  @Column('float')
  score: number;

  @Column('timestamp')
  calculatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.liquidityScores)
  user: UserEntity;

  @ManyToOne(() => CampaignEntity, (campaign) => campaign.liquidityScores)
  campaign: CampaignEntity;
}
