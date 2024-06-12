import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';

import { NS } from '../../common/constants';
import { UserStatus } from '../../common/enums/user';
import { BaseEntity } from '../base.entity';

import { CampaignEntity } from './campaign.entity';
import { ExchangeAPIKeyEntity } from './exchange-api-key.entity';
import { LiquidityScoreEntity } from './liquidity-score.entity';

@Entity({ schema: NS, name: 'users' })
export class UserEntity extends BaseEntity {
  @Column()
  evmAddress: string;

  @Column({ type: 'varchar', nullable: true })
  nonce: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
  })
  public status: UserStatus;

  @ManyToMany(() => CampaignEntity, (campaign) => campaign.users)
  @JoinTable({
    name: 'user-campaigns',
  })
  campaigns: CampaignEntity[];

  @OneToMany(
    () => LiquidityScoreEntity,
    (liquidityScore) => liquidityScore.user,
  )
  liquidityScores: LiquidityScoreEntity[];

  @OneToMany(
    () => ExchangeAPIKeyEntity,
    (exchangeAPIKey) => exchangeAPIKey.user,
  )
  exchangeAPIKeys: ExchangeAPIKeyEntity[];
}
