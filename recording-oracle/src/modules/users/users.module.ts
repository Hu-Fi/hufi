import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserMeController } from './user-me.controller';
import { UserPreferencesEntity } from './user-preferences.entity';
import { UserPreferencesRepository } from './user-preferences.repository';
import { UserPreferencesService } from './user-preferences.service';
import { UserEntity } from './user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([UserPreferencesEntity]),
  ],
  providers: [
    UsersRepository,
    UsersService,
    UserPreferencesService,
    UserPreferencesRepository,
  ],
  controllers: [UserMeController],
  exports: [UsersRepository, UsersService, UserPreferencesRepository],
})
export class UsersModule {}
