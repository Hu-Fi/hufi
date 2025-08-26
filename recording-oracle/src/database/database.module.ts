import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogLevel } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import Environment from '@/common/utils/environment';
import { DatabaseConfigService } from '@/config';
import { RefreshTokenEntity } from '@/modules/auth';
import {
  CampaignEntity,
  UserCampaignEntity,
  VolumeStatEntity,
} from '@/modules/campaigns';
import { ExchangeApiKeyEntity } from '@/modules/exchange-api-keys';
import { UserEntity } from '@/modules/users';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [DatabaseConfigService],
      useFactory: (databaseConfigService: DatabaseConfigService) => {
        const shouldEnableLogging =
          Environment.isDevelopment() &&
          databaseConfigService.logLevels.length > 0;

        return {
          type: 'postgres',
          useUTC: true,

          ...(databaseConfigService.url
            ? {
                url: databaseConfigService.url,
              }
            : {
                host: databaseConfigService.host,
                port: databaseConfigService.port,
                username: databaseConfigService.user,
                password: databaseConfigService.password,
                database: databaseConfigService.database,
              }),
          ssl: databaseConfigService.ssl,

          namingStrategy: new SnakeNamingStrategy(),

          /**
           * Schema synchronization should be done
           * via manually running migrations
           */
          synchronize: false,
          migrationsRun: false,
          entities: [
            CampaignEntity,
            ExchangeApiKeyEntity,
            RefreshTokenEntity,
            UserCampaignEntity,
            UserEntity,
            VolumeStatEntity,
          ],

          logging: shouldEnableLogging
            ? (databaseConfigService.logLevels as LogLevel[])
            : false,
          logger: 'advanced-console',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
