import { Module } from '@nestjs/common';

import { TdxAttestationController } from './tdx-attestation.controller';
import { TdxAttestationService } from './tdx-attestation.service';

@Module({
  controllers: [TdxAttestationController],
  providers: [TdxAttestationService],
  exports: [TdxAttestationService],
})
export class TdxAttestationModule {}
