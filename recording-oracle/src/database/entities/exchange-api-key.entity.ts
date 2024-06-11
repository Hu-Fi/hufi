import { Entity, Column, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../base.entity';

import { UserEntity } from './user.entity';

@Entity({ schema: NS, name: 'exchange-api-keys' })
export class ExchangeAPIKeyEntity extends BaseEntity {
  @Column()
  exchangeName: string; // Exchange Name
  @Column()
  apiKey: string; // Encrypted Read-only API Key for the exchange
  @Column()
  secret: string; // Encrypted secret for the API Key

  @ManyToOne(() => UserEntity, (user) => user.exchangeAPIKeys)
  user: UserEntity;
}
