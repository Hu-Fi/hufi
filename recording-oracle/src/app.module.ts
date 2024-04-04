import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RecordsModule } from './records/records.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Campaign } from './common/entities/campaign.entity';
import { LiquidityScore } from './common/entities/liquidity-score.entity';
import { User } from './common/entities/user.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecordController } from './records/records.controller';
import { RecordService } from './records/records.service';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        Campaign,
        LiquidityScore,
        User],
      synchronize: true,
      autoLoadEntities: true,

    }),
    RecordsModule,
    TypeOrmModule.forFeature([Campaign, LiquidityScore, User]),
    UserModule,
  ],
  controllers: [AppController, RecordController,UserController],
  providers: [AppService, RecordService, UserService],
})
export class AppModule {
}
