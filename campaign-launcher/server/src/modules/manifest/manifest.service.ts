import { Injectable } from '@nestjs/common';

import { JOB_TYPE } from '../../common/constants';
import { StorageService } from '../storage/storage.service';

import {
  ManifestDto,
  ManifestUploadRequestDto,
  ManifestUploadResponseDto,
} from './manifest.dto';

@Injectable()
export class ManifestService {
  constructor(public readonly storageService: StorageService) {}

  public async uploadManifest(
    data: ManifestUploadRequestDto,
  ): Promise<ManifestUploadResponseDto> {
    const { startDate, duration, ...manifestData } = data;

    const startBlock = Math.floor(startDate.getTime() / 1000);
    const endBlock = startBlock + duration;

    const manifest = {
      ...manifestData,
      startBlock,
      endBlock,
      duration,
      type: JOB_TYPE,
    };

    const uploadedFile = await this.storageService.uploadFile(manifest);

    return uploadedFile;
  }

  public async downloadManifest(hash: string): Promise<ManifestDto> {
    return this.storageService.downloadFile(hash);
  }
}
