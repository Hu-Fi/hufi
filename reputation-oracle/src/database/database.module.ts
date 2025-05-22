import * as path from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { NS } from '../common/constants';
import { Web3TransactionEntity } from '../modules/web3-transaction/web3-transaction.entity';
import { WebhookIncomingEntity } from '../modules/webhook/webhook-incoming.entity';

import { PgLockService } from './pg-lock.service';
import { TypeOrmLoggerModule, TypeOrmLoggerService } from './typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmLoggerModule, ConfigModule],
      inject: [TypeOrmLoggerService, ConfigService],
      useFactory: (
        typeOrmLoggerService: TypeOrmLoggerService,
        configService: ConfigService,
      ) => {
        const loggerOptions = configService
          .get<string>('POSTGRES_LOGGING', '')
          ?.split(', ');

        typeOrmLoggerService.setOptions(
          loggerOptions && loggerOptions[0] === 'all'
            ? 'all'
            : (loggerOptions as LoggerOptions) ?? false,
        );

        return {
          name: 'default',
          type: 'postgres',
          entities: [WebhookIncomingEntity, Web3TransactionEntity],
          // We are using migrations, synchronize should be set to false.
          synchronize: false,
          // Run migrations automatically,
          // you can disable this if you prefer running migration manually.
          migrationsTableName: NS,
          migrationsTransactionMode: 'each',
          namingStrategy: new SnakeNamingStrategy(),
          logging:
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'staging',
          // Allow both start:prod and start:dev to use migrations
          // __dirname is either dist or server folder, meaning either
          // the compiled js in prod or the ts in dev.
          migrations: [path.join(__dirname, '/migrations/**/*{.ts,.js}')],
          //"migrations": ["dist/migrations/*{.ts,.js}"],
          logger: typeOrmLoggerService,
          host: configService.get<string>('POSTGRES_HOST', 'localhost'),
          port: configService.get<number>('POSTGRES_PORT', 5432),
          username: configService.get<string>('POSTGRES_USER', 'user'),
          password: configService.get<string>('POSTGRES_PASSWORD', 'password'),
          database: configService.get<string>(
            'POSTGRES_DATABASE',
            'reputation-oracle',
          ),
          keepConnectionAlive: configService.get<string>('NODE_ENV') === 'test',
          migrationsRun: false,
          ssl: configService.get<boolean>('POSTGRES_SSL', false),
        };
      },
    }),
  ],
  providers: [PgLockService],
  exports: [PgLockService],
})
export class DatabaseModule {}
