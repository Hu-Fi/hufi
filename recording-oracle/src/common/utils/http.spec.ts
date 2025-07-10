import * as crypto from 'crypto';
import { Readable } from 'stream';

import { faker } from '@faker-js/faker';
import nock from 'nock';

import { generateRandomHashString } from '~/test/fixtures/crypto';

import * as httpUtils from './http';

describe('HTTP utilities', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('downloadFile', () => {
    it('should throw for invalid url', async () => {
      const invalidUrl = faker.internet.domainName();

      let thrownError;
      try {
        await httpUtils.downloadFile(invalidUrl);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.location).toBe(invalidUrl);
      expect(thrownError.details).toBe('Invalid http url');
    });

    it('should throw if file not found', async () => {
      const url = faker.internet.url();

      const scope = nock(url).get('/').reply(404);

      let thrownError;
      try {
        await httpUtils.downloadFile(url);
      } catch (error) {
        thrownError = error;
      }

      scope.done();

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.location).toBe(url);
      expect(thrownError.details).toBe('File not found');
    });

    it('should format response errors', async () => {
      const url = faker.internet.url();
      const ERROR_MESSAGE = faker.lorem.words();

      const scope = nock(url).get('/').replyWithError(ERROR_MESSAGE);

      let thrownError;
      try {
        await httpUtils.downloadFile(url);
      } catch (error) {
        thrownError = error;
      }

      scope.done();

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.location).toBe(url);
      expect(thrownError.details).toBe(ERROR_MESSAGE);
    });

    it('should download file as buffer', async () => {
      const url = faker.internet.url();
      const content = faker.lorem.paragraph();

      const scope = nock(url)
        .get('/')
        .reply(200, () => Readable.from(Buffer.from(content)));

      const downloadedFile = await httpUtils.downloadFile(url);

      scope.done();

      expect(downloadedFile).toBeInstanceOf(Buffer);
      expect(downloadedFile.toString()).toBe(content);
    });

    it('should download file as stream', async () => {
      const url = faker.internet.url();
      const content = faker.lorem.paragraph();

      const scope = nock(url)
        .get('/')
        .reply(200, () => Readable.from(Buffer.from(content)));

      const downloadedFileStream = await httpUtils.downloadFile(url, {
        asStream: true,
      });

      scope.done();

      expect(downloadedFileStream).toBeInstanceOf(ReadableStream);

      const chunks = [];
      for await (const chunk of downloadedFileStream) {
        chunks.push(chunk);
      }
      const downloadedContent = Buffer.concat(chunks).toString();
      expect(downloadedContent).toEqual(content);
    });
  });

  describe('downloadFileAndVerifyHash', () => {
    it('should throw when downloaded file hash is not valid', async () => {
      const fileUrl = faker.internet.url();
      const fileContent = faker.string.sample();
      const fileHash = crypto
        .createHash('sha256')
        .update(fileContent)
        .digest('hex');

      const scope = nock(fileUrl)
        .get('/')
        .reply(200, () => Readable.from(Buffer.from(fileContent)));

      const randomHash = generateRandomHashString('sha256');
      let thrownError;
      try {
        await httpUtils.downloadFileAndVerifyHash(fileUrl, randomHash);
      } catch (error) {
        thrownError = error;
      }

      scope.done();

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Invalid file hash');
      expect(thrownError.fileUrl).toBe(fileUrl);
      expect(thrownError.details.expectedHash).toBe(randomHash);
      expect(thrownError.details.fileHash).toBe(fileHash);
    });

    it('should return file content when hash is valid', async () => {
      const fileUrl = faker.internet.url();
      const fileContent = faker.string.sample();
      const fileHash = crypto
        .createHash('sha1')
        .update(fileContent)
        .digest('hex');

      const scope = nock(fileUrl)
        .get('/')
        .reply(200, () => Readable.from(Buffer.from(fileContent)));

      const downlaodedFile = await httpUtils.downloadFileAndVerifyHash(
        fileUrl,
        fileHash,
        { algorithm: 'sha1' },
      );

      scope.done();

      expect(downlaodedFile.toString()).toBe(fileContent);
    });
  });
});
