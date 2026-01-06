import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { ExceptionFilter } from './common/filters/exception';
import { TransformInterceptor } from './common/interceptors';
import { HttpValidationPipe } from './common/pipes';
import Environment from './common/utils/environment';
import { EnvConfigModule, envValidator } from './config';
import { CampaignModule } from './modules/campaigns';
import { ExchangesModule } from './modules/exchanges';
import { HealthModule } from './modules/health';
import { StatisticsModule } from './modules/statistics';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
    /**
     * Interceptors are called:
     * - for request: in direct order
     * - for response: in reverse order
     *
     * So order matters here for serialization.
     */
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
  imports: [
    HealthModule,
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    ScheduleModule.forRoot(),
    CampaignModule,
    EnvConfigModule,
    ExchangesModule,
    StatisticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
