import { ChainId } from '@human-protocol/sdk';
import { Column, Entity, Index } from 'typeorm';

import { NS } from '../../common/constants';
import { WebhookStatus } from '../../common/enums';
import { BaseEntity } from '../../database/base.entity';

@Entity({ schema: NS, name: 'webhook_incoming' })
@Index(['chainId', 'escrowAddress', 'payload'], { unique: true })
export class WebhookIncomingEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: ChainId;

  @Column({ type: 'varchar', nullable: true })
  public oracleAddress: string;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({ type: 'varchar', nullable: true })
  public resultsUrl: string;

  @Column({ type: 'boolean', nullable: true })
  public checkPassed: boolean;

  @Column({ type: 'int' })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;

  @Column({
    type: 'enum',
    enum: WebhookStatus,
  })
  public status: WebhookStatus;

  @Column({ type: 'varchar' })
  public payload: string;
}
