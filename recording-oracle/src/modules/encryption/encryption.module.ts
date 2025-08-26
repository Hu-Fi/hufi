import { Module } from '@nestjs/common';

import { AesEncryptionService } from './aes-encryption.service';

@Module({
  imports: [],
  providers: [AesEncryptionService],
  exports: [AesEncryptionService],
})
export class EncryptionModule {}
