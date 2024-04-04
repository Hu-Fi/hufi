// campaign.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { LiquidityScore } from './liquidity-score.entity';

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  address: string; // Ethereum address identifying the campaign

  @ManyToMany(() => User, (user) => user.campaigns)
  users: User[];

  @OneToMany(() => LiquidityScore, (liquidityScore) => liquidityScore.campaign)
  liquidityScores: LiquidityScore[];
}
