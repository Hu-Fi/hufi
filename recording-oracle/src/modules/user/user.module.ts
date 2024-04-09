import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Campaign } from '../../common/entities/campaign.entity';
import { User } from '../../common/entities/user.entity';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Campaign]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Export UserService if it's used outside this module
})
export class UserModule {}
