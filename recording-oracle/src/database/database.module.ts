import * as path from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { DatabaseConfigService } from '../common/config/database-config.service';
import { ServerConfigService } from '../common/config/server-config.service';
import { NS } from '../common/constants';

import {
  CampaignEntity,
  ExchangeAPIKeyEntity,
  LiquidityScoreEntity,
  TokenEntity,
  UserEntity,
  Web3TransactionEntity,
} from './entities';
import { PgLockService } from './pg-lock.service';
import { TypeOrmLoggerModule, TypeOrmLoggerService } from './typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmLoggerModule, ConfigModule],
      inject: [
        TypeOrmLoggerService,
        DatabaseConfigService,
        ServerConfigService,
      ],
      useFactory: (
        typeOrmLoggerService: TypeOrmLoggerService,
        databaseConfigService: DatabaseConfigService,
        serverConfigService: ServerConfigService,
      ) => {
        const loggerOptions = databaseConfigService.logging?.split(', ');
        typeOrmLoggerService.setOptions(
          loggerOptions && loggerOptions[0] === 'all'
            ? 'all'
            : (loggerOptions as LoggerOptions) ?? false,
        );
        return {
          name: 'default',
          type: 'postgres',
          entities: [
            CampaignEntity,
            ExchangeAPIKeyEntity,
            LiquidityScoreEntity,
            TokenEntity,
            UserEntity,
            Web3TransactionEntity,
          ],
          // We are using migrations, synchronize should be set to false.
          synchronize: false,
          // Run migrations automatically,
          // you can disable this if you prefer running migration manually.
          migrationsTableName: NS,
          migrationsTransactionMode: 'each',
          namingStrategy: new SnakeNamingStrategy(),
          logging: true,
          // Allow both start:prod and start:dev to use migrations
          // __dirname is either dist or server folder, meaning either
          // the compiled js in prod or the ts in dev.
          migrations: [path.join(__dirname, '/migrations/**/*{.ts,.js}')],
          //"migrations": ["dist/migrations/*{.ts,.js}"],
          logger: typeOrmLoggerService,
          host: databaseConfigService.host,
          port: databaseConfigService.port,
          username: databaseConfigService.user,
          password: databaseConfigService.password,
          database: databaseConfigService.database,
          keepConnectionAlive: serverConfigService.nodeEnv === 'test',
          migrationsRun: false,
          ssl: databaseConfigService.ssl,
        };
      },
    }),
  ],
  providers: [PgLockService],
  exports: [PgLockService],
})
export class DatabaseModule {}
