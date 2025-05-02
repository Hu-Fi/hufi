import { Injectable } from '@nestjs/common';

import { JOB_TYPE } from '../../common/constants';
import { StorageService } from '../storage/storage.service';

import {
  ManifestUploadRequestDto,
  ManifestUploadRequestDtoV2,
  ManifestUploadResponseDto,
} from './manifest.dto';

@Injectable()
export class ManifestService {
  constructor(public readonly storageService: StorageService) {}

  public async uploadManifest(
    data: ManifestUploadRequestDto,
  ): Promise<ManifestUploadResponseDto> {
    const { startDate, duration, additionalData, ...manifestData } = data;

    const startBlock = Math.floor(startDate.getTime() / 1000);
    const endBlock = startBlock + duration;

    const manifest = {
      ...manifestData,
      startBlock,
      endBlock,
      duration,
      type: JOB_TYPE,
      ...(additionalData ? JSON.parse(additionalData) : {}),
    };

    const uploadedFile = await this.storageService.uploadFile(manifest);

    return uploadedFile;
  }

  public async uploadManifestV2(
    data: ManifestUploadRequestDtoV2,
  ): Promise<ManifestUploadResponseDto> {
    const { startDate, endDate, ...manifestData } = data;

    const startBlock = Math.floor(startDate.getTime() / 1000);
    const endBlock = Math.floor(endDate.getTime() / 1000);

    const manifest = {
      ...manifestData,
      startBlock,
      endBlock,
      type: JOB_TYPE,
    };

    const uploadedFile = await this.storageService.uploadFile(manifest);

    return uploadedFile;
  }
}
