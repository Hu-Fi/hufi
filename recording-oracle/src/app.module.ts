import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards';
import { EnvConfigModule, envValidator } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health';
import { UsersModule } from './modules/users';
import Environment from './utils/environment';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
    AuthModule,
    DatabaseModule,
    EnvConfigModule,
    HealthModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
