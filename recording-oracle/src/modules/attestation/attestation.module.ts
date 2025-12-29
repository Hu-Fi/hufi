import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AttestationController } from './attestation.controller';
import { AttestationService } from './attestation.service';

@Module({
  imports: [ConfigModule],
  controllers: [AttestationController],
  providers: [AttestationService],
  exports: [AttestationService],
})
export class AttestationModule {}
