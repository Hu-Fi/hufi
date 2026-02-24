import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ParticipationEntity } from './participation.entity';
import { ParticipationsRepository } from './participations.repository';
import { ParticipationsService } from './participations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipationEntity])],
  providers: [ParticipationsRepository, ParticipationsService],
  exports: [ParticipationsRepository, ParticipationsService],
})
export class ParticipationsModule {}
