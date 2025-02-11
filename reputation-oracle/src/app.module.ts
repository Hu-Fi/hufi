import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './app.controller';
import { envValidator } from './common/config';
import { EnvConfigModule } from './common/config/config.module';
import { DatabaseExceptionFilter } from './common/exceptions/database.filter';
import { SnakeCaseInterceptor } from './common/interceptors';
import { HttpValidationPipe } from './common/pipes';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { PayoutModule } from './modules/payout/payout.module';
import { Web3Module } from './modules/web3/web3.module';
import { Web3TransactionModule } from './modules/web3-transaction/web3-transaction.module';
import { WebhookModule } from './modules/webhook/webhook.module';

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
      rootPath: join(__dirname, '././modules/', 'node_modules/swagger-ui-dist'),
    }),
    EnvConfigModule,
    ScheduleModule.forRoot(),
    Web3TransactionModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
