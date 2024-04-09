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
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [Campaign, LiquidityScore, User],
      synchronize: true,
      autoLoadEntities: true,
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
