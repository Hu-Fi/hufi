import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { ExceptionFilter } from './common/filters/exception';
import { JwtAuthGuard } from './common/guards';
import { TransformInterceptor } from './common/interceptors';
import { HttpValidationPipe } from './common/pipes';
import Environment from './common/utils/environment';
import { EnvConfigModule, envValidator } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { CampaignsModule } from './modules/campaigns';
import { ExchangeApiKeysModule } from './modules/exchange-api-keys';
import { HealthModule } from './modules/health';
import { StatisticsModule } from './modules/statistics';
import { UsersModule } from './modules/users';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
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
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CampaignsModule,
    DatabaseModule,
    EnvConfigModule,
    ExchangeApiKeysModule,
    HealthModule,
    UsersModule,
    StatisticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
