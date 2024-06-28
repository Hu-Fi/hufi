import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';

import { envValidator } from '../../common/config';
import { EnvConfigModule } from '../../common/config/config.module';
import { DatabaseExceptionFilter } from '../../common/exceptions/database.filter';
import { SnakeCaseInterceptor } from '../../common/interceptors';
import { HttpValidationPipe } from '../../common/pipes';
import { DatabaseModule } from '../../database/database.module';
import { HealthModule } from '../health/health.module';
import { PayoutModule } from '../payout/payout.module';
import { Web3Module } from '../web3/web3.module';
import { WebhookModule } from '../webhook/webhook.module';

import { AppController } from './app.controller';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    DatabaseModule,
    HealthModule,
    WebhookModule,
    Web3Module,
    PayoutModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../', 'node_modules/swagger-ui-dist'),
    }),
    EnvConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
})
export class AppModule {}
