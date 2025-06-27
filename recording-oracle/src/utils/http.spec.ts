import { Readable } from 'stream';

import { faker } from '@faker-js/faker';
import nock from 'nock';

import * as httpUtils from './http';

describe('HTTP utilities', () => {
  describe('downloadFile', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    afterAll(() => {
      nock.restore();
    });

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
      expect(thrownError.detail).toBe('Invalid http url');
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
      expect(thrownError.detail).toBe('File not found');
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
      expect(thrownError.detail).toBe(ERROR_MESSAGE);
    });

    it('should download file as buffer', async () => {
      const content = faker.lorem.paragraph();

      const url = faker.internet.url();

      const scope = nock(url)
        .get('/')
        .reply(200, () => Readable.from(Buffer.from(content)));

      const downloadedFile = await httpUtils.downloadFile(url);

      scope.done();
      expect(downloadedFile).toBeInstanceOf(Buffer);
      expect(downloadedFile.toString()).toBe(content);
    });

    it('should download file as stream', async () => {
      const content = faker.lorem.paragraph();

      const url = faker.internet.url();

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
});
