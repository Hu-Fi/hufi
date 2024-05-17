import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvConfigModule } from '../../common/config/config.module';
import { envValidator } from '../../common/config/env-schema';
import { Campaign } from '../../common/entities/campaign.entity';
import { LiquidityScore } from '../../common/entities/liquidity-score.entity';
import { User } from '../../common/entities/user.entity';
import { HttpValidationPipe } from '../../common/pipes';
import { HealthModule } from '../health/health.module';
import { RecordsModule } from '../records/records.module';
import { UserModule } from '../user/user.module';

import { AppController } from './app.controller';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    EnvConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [Campaign, LiquidityScore, User],
      synchronize: true,
      autoLoadEntities: true,
      ssl: process.env.POSTGRES_SSL === 'true',
    }),
    HealthModule,
    RecordsModule,
    UserModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../', 'node_modules/swagger-ui-dist'),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
