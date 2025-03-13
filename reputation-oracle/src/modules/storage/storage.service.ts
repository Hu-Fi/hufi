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

  public getUrl(key: string): string {
    const protocol = this.s3ConfigService.useSSL ? 'https' : 'http';
    return `${protocol}://${this.s3ConfigService.endPoint}:${this.s3ConfigService.port}/${this.s3ConfigService.bucket}/${key}`;
  }

  /**
   * Downloads content from a given URL using the StorageClient
   */
  public async download(url: string): Promise<any> {
    try {
      return await StorageClient.downloadFileFromUrl(url);
    } catch {
      // Return an empty array or some fallback if the download fails
      return [];
    }
  }

  /**
   * Uploads a JSON array of `LiquidityDto` objects to Minio/S3 and returns
   * the URL and an SHA1 hash of the content.
   */
  public async uploadLiquidities(
    escrowAddress: string,
    chainId: ChainId,
    liquidities: LiquidityDto[],
  ): Promise<SaveLiquidityDto> {
    // Ensure bucket exists first
    if (!(await this.minioClient.bucketExists(this.s3ConfigService.bucket))) {
      throw new BadRequestException('Bucket not found');
    }

    // Convert the array to a JSON string
    const contentString = JSON.stringify(liquidities);

    try {
      // Create a hash of the content
      const hash = crypto.createHash('sha1').update(contentString).digest('hex');
      const filename = `${escrowAddress}-${chainId}-${Date.now()}.json`;

      // Upload the JSON string
      await this.minioClient.putObject(
        this.s3ConfigService.bucket,
        filename,
        contentString,
        contentString.length,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      return {
        url: this.getUrl(filename),
        hash,
      };
    } catch (e) {
      throw new BadRequestException(`File not uploaded: ${e.message}`);
    }
  }
}
