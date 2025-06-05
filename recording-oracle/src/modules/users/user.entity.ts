import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 42, unique: true })
  evmAddress: string;

  @Column('varchar', { length: 32 })
  nonce: string;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;
}
