import crypto from 'crypto';

import { ChainId, StorageClient, UploadFile } from '@human-protocol/sdk';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as Minio from 'minio';

import { S3ConfigService } from '../../common/config/s3-config.service';

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(public readonly s3ConfigService: S3ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3ConfigService.endPoint,
      port: this.s3ConfigService.port,
      accessKey: this.s3ConfigService.accessKey,
      secretKey: this.s3ConfigService.secretKey,
      useSSL: this.s3ConfigService.useSSL,
    });
  }
  public getUrl(filename: string): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endPoint
    }:${this.s3ConfigService.port}/${this.s3ConfigService.bucket}/${filename}`;
  }

  public async download(url: string): Promise<any> {
    try {
      return await StorageClient.downloadFileFromUrl(url);
    } catch {
      return [];
    }
  }

  public async uploadEscrowResult(
    escrowAddress: string,
    chainId: ChainId,
    data: any,
  ): Promise<UploadFile> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new BadRequestException('Bucket not found');
    }

    let content;
    if (typeof data === 'string') {
      content = data;
    } else {
      content = JSON.stringify(data);
    }

    try {
      const date = Date.now();
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const filename = `${escrowAddress}-${chainId}-${date}.json`;
      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        filename,
        JSON.stringify(content),
        content.length,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return {
        key: filename,
        url: this.getUrl(filename),
        hash,
      };
    } catch (e) {
      throw new BadRequestException('File not uploaded');
    }
  }
}
