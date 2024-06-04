import crypto from 'crypto';

import { ChainId, StorageClient } from '@human-protocol/sdk';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as Minio from 'minio';

import { S3ConfigService } from '../../common/config/s3-config.service';
import { LiquidityDto } from '../webhook/webhook.dto';

import { SaveLiquidityDto } from './storage.dto';

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
  public getUrl(escrowAddress: string, chainId: ChainId): string {
    return `${this.s3ConfigService.useSSL ? 'https' : 'http'}://${
      this.s3ConfigService.endPoint
    }:${this.s3ConfigService.port}/${
      this.s3ConfigService.bucket
    }/${escrowAddress}-${chainId}.json`;
  }

  public async download(url: string): Promise<any> {
    try {
      return await StorageClient.downloadFileFromUrl(url);
    } catch {
      return [];
    }
  }

  public async uploadLiquidities(
    escrowAddress: string,
    chainId: ChainId,
    liquidities: LiquidityDto[],
  ): Promise<SaveLiquidityDto> {
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new BadRequestException('Bucket not found');
    }
    const content = JSON.stringify(liquidities);
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

      return { url: this.getUrl(escrowAddress, chainId), hash };
    } catch (e) {
      throw new BadRequestException('File not uploaded');
    }
  }
}
