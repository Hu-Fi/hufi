import { Module } from '@nestjs/common';

import { ManifestController } from './manifest.controller';
import { ManifestService } from './manifest.service';

import { StorageService } from '@/modules/storage/storage.service';

@Module({
  controllers: [ManifestController],
  providers: [ManifestService, StorageService],
})
export class ManifestModule {}
