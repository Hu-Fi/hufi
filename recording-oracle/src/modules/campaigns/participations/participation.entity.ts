import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import type { UserEntity } from '@/modules/users';

import type { CampaignEntity } from '../campaign.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'participations' })
export class ParticipationEntity {
  @ManyToOne('UserEntity', {
    onDelete: 'CASCADE',
    persistence: false,
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @PrimaryColumn()
  userId: string;

  @ManyToOne('CampaignEntity', {
    persistence: false,
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: CampaignEntity;

  @PrimaryColumn()
  @Index('idx_users_campaigns_campaign_id')
  campaignId: string;

  @Column({ type: 'timestamptz' })
  createdAt: Date;
}
