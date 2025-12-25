import { Module } from '@nestjs/common';

import { TdxVerificationController } from './tdx-verification.controller';
import { TdxVerificationService } from './tdx-verification.service';

@Module({
  controllers: [TdxVerificationController],
  providers: [TdxVerificationService],
  exports: [TdxVerificationService],
})
export class TdxVerificationModule {}
