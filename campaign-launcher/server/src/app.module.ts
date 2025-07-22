import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller';
import { ExceptionFilter } from './common/filters/exception';
import { TransformInterceptor } from './common/interceptors';
import { HttpValidationPipe } from './common/pipes';
import Environment from './common/utils/environment';
import { EnvConfigModule, envValidator } from './config';
import { ExchangesModule } from './modules/exchanges';
import { HealthModule } from './modules/health';

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
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    EnvConfigModule,
    ExchangesModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
