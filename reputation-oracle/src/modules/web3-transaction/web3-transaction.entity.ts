import { Entity, Column } from 'typeorm';

import { NS } from '../../common/constants';
import { Web3TransactionStatus } from '../../common/enums/web3-transaction';
import { BaseEntity } from '../../database/base.entity';

@Entity({ schema: NS, name: 'web3-transaction' })
export class Web3TransactionEntity extends BaseEntity {
  @Column()
  chainId: number; // Chain ID of the campaign

  @Column()
  contract: string; // Contract to interact with. Possible values: 'escrow'

  @Column()
  address: string; // Contract address

  @Column()
  method: string; // Contract method to call

  @Column('json')
  data: Array<any>; // Arguments to pass to the contract method

  @Column({
    enum: Web3TransactionStatus,
  })
  status: Web3TransactionStatus; // Status of the transaction
}
