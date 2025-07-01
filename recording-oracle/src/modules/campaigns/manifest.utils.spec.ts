import { faker } from '@faker-js/faker';
import nock from 'nock';

import { generateCampaignManifest, generateTradingPair } from './fixtures';
import * as manifestUtils from './manifest.utils';

function generateManifestResponse() {
  const manifest = generateCampaignManifest();

  return {
    ...manifest,
    start_date: manifest.start_date.toISOString(),
    end_date: manifest.end_date.toISOString(),
  };
}

describe('manifest utils', () => {
  describe('downloadCampaignManifest', () => {
    let manifestUrl: string;

    beforeEach(() => {
      manifestUrl = faker.internet.url();
    });

    afterEach(() => {
      nock.cleanAll();
    });

    afterAll(() => {
      nock.restore();
    });

    it('should throw when manifest not found', async () => {
      const scope = nock(manifestUrl).get('/').reply(404);

      let thrownError;
      try {
        await manifestUtils.downloadCampaignManifest(
          manifestUrl,
          faker.string.hexadecimal(),
        );
      } catch (error) {
        thrownError = error;
      }

      scope.done();
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Failed to load manifest');
    });

    it.each([
      {},
      {
        type: faker.number.int(),
        exchange: faker.lorem.word(),
        daily_volume_target: faker.number.float({ min: -42, max: 0 }),
        pair: generateTradingPair().replace('/', '-'),
        fund_token: faker.string.alpha({ length: 11 }),
        start_date: faker.date.recent().valueOf(),
        end_date: faker.date.future().valueOf(),
      },
      Object.assign(
        generateManifestResponse(),
        (() => {
          const nowIsoString = new Date().toISOString();

          return {
            start_date: nowIsoString,
            end_date: nowIsoString,
          };
        })(),
      ),
    ])(
      'should throw when invalid manifest schema [%#]',
      async (manifestResponse) => {
        const scope = nock(manifestUrl).get('/').reply(200, manifestResponse);
        const manifestHash = manifestUtils.calculateManifestHash(
          JSON.stringify(manifestResponse),
        );
        let thrownError;
        try {
          await manifestUtils.downloadCampaignManifest(
            manifestUrl,
            manifestHash,
          );
        } catch (error) {
          thrownError = error;
        }

        scope.done();
        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Invalid manifest schema');
      },
    );

    it('should download valid manifest', async () => {
      const mockedManifest = generateManifestResponse();
      const mockedManifestHash = manifestUtils.calculateManifestHash(
        JSON.stringify(mockedManifest),
      );
      const scope = nock(manifestUrl).get('/').reply(200, mockedManifest);

      const downloadedManifest = await manifestUtils.downloadCampaignManifest(
        manifestUrl,
        mockedManifestHash,
      );

      scope.done();
      expect(downloadedManifest).toEqual({
        ...mockedManifest,
        start_date: new Date(mockedManifest.start_date),
        end_date: new Date(mockedManifest.end_date),
      });
    });

    it('should download valid manifest and strip unknown fields', async () => {
      const strippedManifest = generateManifestResponse();
      const manifestWithExtra = {
        ...strippedManifest,
        unknown_field: faker.string.sample(),
      };
      const mockedManifestHash = manifestUtils.calculateManifestHash(
        JSON.stringify(manifestWithExtra),
      );

      const scope = nock(manifestUrl).get('/').reply(200, manifestWithExtra);

      const downloadedManifest = await manifestUtils.downloadCampaignManifest(
        manifestUrl,
        mockedManifestHash,
      );

      scope.done();
      expect(downloadedManifest).toEqual({
        ...strippedManifest,
        start_date: new Date(strippedManifest.start_date),
        end_date: new Date(strippedManifest.end_date),
      });
    });

    it('should throw when invalid manifest hash', async () => {
      const mockedManifest = generateManifestResponse();
      const invalidHash = faker.string.hexadecimal();
      const scope = nock(manifestUrl).get('/').reply(200, mockedManifest);

      let thrownError;
      try {
        await manifestUtils.downloadCampaignManifest(manifestUrl, invalidHash);
      } catch (error) {
        thrownError = error;
      }

      scope.done();
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Invalid manifest hash');
    });
  });
});
