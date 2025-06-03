import { Module } from '@nestjs/common';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [],
  providers: [UsersRepository, UsersService],
  controllers: [],
  exports: [UsersService],
})
export class UsersModule {}
