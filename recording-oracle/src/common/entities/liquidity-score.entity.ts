// liquidity-score.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity()
export class LiquidityScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  score: number;

  @Column('timestamp')
  calculatedAt: Date;

  @ManyToOne(() => Campaign, (campaign) => campaign.liquidityScores)
  campaign: Campaign;
}
