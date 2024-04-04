import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: string; // Ensure this matches what you're using in the service

  @Column()
  exchange: string; // Ensure this matches what you're using in the service
  @Column()
  apiKey: string; // Ensure encrypted API key is stored as a string

  @Column()
  secret: string; // Ensure encrypted secret is stored as a string

  @ManyToMany(() => Campaign, (campaign) => campaign.users)
  @JoinTable()
  campaigns: Campaign[]; // Ensure this relationship is correctly set up
}
