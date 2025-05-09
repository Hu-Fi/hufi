import {
  BaseEntity as OrmBaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class BaseEntity extends OrmBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  @BeforeInsert()
  public beforeInsert(): void {
    const date = new Date();
    this.createdAt = date;
    this.updatedAt = date;
  }

  @BeforeUpdate()
  public beforeUpdate(): void {
    const date = new Date();
    this.updatedAt = date;
  }
}
