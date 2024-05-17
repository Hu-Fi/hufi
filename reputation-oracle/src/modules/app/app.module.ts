import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { DatabaseModule } from '../../database/database.module';
import { envValidator } from '../../common/config';
import { EnvConfigModule } from '../../common/config/config.module';
import { DatabaseExceptionFilter } from '../../common/exceptions/database.filter';
import { SnakeCaseInterceptor } from '../../common/interceptors';
import { HttpValidationPipe } from '../../common/pipes';
import { HealthModule } from '../health/health.module';
import { WebhookModule } from '../webhook/webhook.module';
import { Web3Module } from '../web3/web3.module';

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../', 'node_modules/swagger-ui-dist'),
    }),
    EnvConfigModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
