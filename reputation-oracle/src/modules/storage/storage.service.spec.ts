import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { Client as MinioClient } from 'minio';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { ContentType } from '@/common/enums';
import { S3ConfigService } from '@/config';

import { MinioErrorCodes } from './minio.constants';
import { StorageService } from './storage.service';

vi.mock('minio');

const mockedMinioClientInstance = {
  statObject: vi.fn(),
  bucketExists: vi.fn(),
  putObject: vi.fn(),
};

const mockS3ConfigService: Omit<S3ConfigService, 'configService'> = {
  endpoint: faker.internet.domainName(),
  port: faker.internet.port(),
  accessKey: faker.internet.password(),
  secretKey: faker.internet.password(),
  bucket: faker.lorem.word(),
  useSSL: true,
};

function constructExpectedS3FileUrl(fileName: string) {
  return (
    'https://' +
    `${mockS3ConfigService.endpoint}:${mockS3ConfigService.port}/` +
    `${mockS3ConfigService.bucket}/${fileName}`
  );
}

describe('StorageService', () => {
  let storageService: StorageService;

  beforeAll(async () => {
    vi.mocked(MinioClient).mockImplementation(function MinioClientMock() {
      return mockedMinioClientInstance;
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: S3ConfigService,
          useValue: mockS3ConfigService,
        },
        StorageService,
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('uploadData', () => {
    test('should throw if configured bucket does not exist', async () => {
      mockedMinioClientInstance.bucketExists.mockImplementation(
        (bucketName: string) => {
          if (bucketName === mockS3ConfigService.bucket) {
            return false;
          }

          return true;
        },
      );

      await expect(
        storageService.uploadData(
          faker.string.sample(),
          faker.system.fileName(),
          ContentType.PLAIN_TEXT,
        ),
      ).rejects.toThrow("Can't find configured bucket");

      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledTimes(0);
    });

    test('should not upload if file already exists', async () => {
      mockedMinioClientInstance.bucketExists.mockResolvedValueOnce(true);

      const fileName = `${faker.lorem.word()}.json`;
      mockedMinioClientInstance.statObject.mockImplementation(
        (bucketName: string, key: string) => {
          if (bucketName === mockS3ConfigService.bucket && key === fileName) {
            return {};
          }

          throw {
            code: MinioErrorCodes.NotFound,
          };
        },
      );

      const fileUrl = await storageService.uploadData(
        JSON.stringify({ test: faker.string.sample() }),
        fileName,
        ContentType.JSON,
      );
      expect(fileUrl).toBe(constructExpectedS3FileUrl(fileName));
      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledTimes(0);
    });

    test('should upload if file does not exists', async () => {
      mockedMinioClientInstance.bucketExists.mockResolvedValueOnce(true);

      const fileName = faker.system.fileName();
      mockedMinioClientInstance.statObject.mockRejectedValue({
        code: MinioErrorCodes.NotFound,
      });
      const fileContent = Buffer.from(faker.string.sample());
      const contentType = ContentType.BINARY;

      const fileUrl = await storageService.uploadData(
        fileContent,
        fileName,
        contentType,
      );
      expect(fileUrl).toBe(constructExpectedS3FileUrl(fileName));
      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledTimes(1);
      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledWith(
        mockS3ConfigService.bucket,
        fileName,
        fileContent,
        undefined,
        {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      );
    });
  });
});
