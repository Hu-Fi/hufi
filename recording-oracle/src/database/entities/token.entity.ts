import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { TokenType } from '../../common/enums/token';
import { BaseEntity } from '../base.entity';

import { UserEntity } from './user.entity';

@Entity({ schema: NS, name: 'tokens' })
export class TokenEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: TokenType,
  })
  public type: TokenType;

  @Column({ type: 'timestamptz' })
  public expiresAt: Date;

  @JoinColumn()
  @ManyToOne(() => UserEntity, { eager: true })
  public user: UserEntity;

  @Column()
  public userId: string;
}
