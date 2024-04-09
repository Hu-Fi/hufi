import { Module } from '@nestjs/common';

import { StorageService } from '../storage/storage.service';

import { ManifestController } from './manifest.controller';
import { ManifestService } from './manifest.service';

@Module({
  controllers: [ManifestController],
  providers: [ManifestService, StorageService],
})
export class ManifestModule {}
