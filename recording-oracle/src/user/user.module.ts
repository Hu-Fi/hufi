import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { UserService } from './user.service';
import { Campaign } from 'src/common/entities/campaign.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]),TypeOrmModule.forFeature([Campaign])],
  providers: [UserService],
  exports: [UserService], // Export UserService if it's used outside this module
})
export class UserModule {}