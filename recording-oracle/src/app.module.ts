import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvConfigModule, envValidator } from './config';
import { DatabaseModule } from './database';
import { HealthModule } from './modules/health';
import { UsersModule } from './modules/users';
import Environment from './utils/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      /**
       * First value found takes precendece
       */
      envFilePath: [`.env.${Environment.name}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    DatabaseModule,
    EnvConfigModule,
    HealthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
