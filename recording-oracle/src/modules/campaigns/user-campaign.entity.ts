import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import type { ExchangeApiKeyEntity } from '@/modules/exchange-api-keys';
import type { UserEntity } from '@/modules/users';

import type { CampaignEntity } from './campaign.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'user_campaigns' })
export class UserCampaignEntity {
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

  /**
   * Do not fetch exchange api key entity from DB,
   * use corresponding service instead to get decoded data.
   *
   * This relation is just to remove user from campaign
   * if they remove exchange API key.
   */
  @ManyToOne('ExchangeApiKeyEntity', {
    onDelete: 'CASCADE',
    persistence: false,
  })
  @JoinColumn({ name: 'exchange_api_key_id' })
  exchangeApiKey?: ExchangeApiKeyEntity;

  @Column()
  exchangeApiKeyId: string;

  @Column({ type: 'timestamptz' })
  createdAt: Date;
}
