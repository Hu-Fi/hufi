import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { S3ConfigService } from '../../common/config/s3-config.service';
import { ErrorBucket } from '../../common/constants/errors';
import { ContentType } from '../../common/enums/storage';
import {
  MOCK_MANIFEST,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../test/constants';

import { StorageService } from './storage.service';

jest.mock('minio', () => {
  class Client {
    putObject = jest.fn();
    bucketExists = jest.fn();
    constructor() {
      (this as any).protocol = 'http:';
      (this as any).host = 'localhost';
      (this as any).port = 9000;
    }
  }

  return { Client };
});

jest.mock('axios');

describe('StorageService', () => {
  let storageService: StorageService;

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'S3_BUCKET':
            return MOCK_S3_BUCKET;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs('s3', () => ({
            accessKey: MOCK_S3_ACCESS_KEY,
            secretKey: MOCK_S3_SECRET_KEY,
            endPoint: MOCK_S3_ENDPOINT,
            port: MOCK_S3_PORT,
            useSSL: MOCK_S3_USE_SSL,
            bucket: MOCK_S3_BUCKET,
          })),
        ),
      ],
      providers: [
        StorageService,
        S3ConfigService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
  });

  describe('uploadFile', () => {
    it('should upload the manifest correctly', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);

      const fileData = await storageService.uploadFile(MOCK_MANIFEST);
      expect(fileData).toEqual({
        url: expect.any(String),
        hash: expect.any(String),
      });
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        MOCK_S3_BUCKET,
        expect.any(String),
        expect.any(String),
        {
          'Content-Type': ContentType.APPLICATION_JSON,
          'Cache-Control': 'no-store',
        },
      );
    });

    it('should fail if the bucket does not exist', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(false);

      await expect(storageService.uploadFile(MOCK_MANIFEST)).rejects.toThrow(
        ErrorBucket.NotExist,
      );
    });

    it('should fail if the file cannot be uploaded', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);
      storageService.minioClient.putObject = jest
        .fn()
        .mockRejectedValueOnce('Network error');

      await expect(storageService.uploadFile(MOCK_MANIFEST)).rejects.toThrow(
        'File not uploaded',
      );
    });
  });
});
