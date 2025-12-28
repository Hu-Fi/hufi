import { Module } from '@nestjs/common';

import { IntelDcapService } from './intel-dcap.service';
import { TdxVerificationController } from './tdx-verification.controller';
import { TdxVerificationService } from './tdx-verification.service';

@Module({
  controllers: [TdxVerificationController],
  providers: [TdxVerificationService, IntelDcapService],
  exports: [TdxVerificationService, IntelDcapService],
})
export class TdxVerificationModule {}
