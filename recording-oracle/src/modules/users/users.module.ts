import { Module } from '@nestjs/common';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [],
  providers: [UsersRepository, UsersService],
  controllers: [],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
