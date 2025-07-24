import { faker } from '@faker-js/faker';
import nock from 'nock';

import { generateTradingPair } from '@/modules/exchange/fixtures';

import { generateCampaignManifest } from './fixtures';
import * as manifestUtils from './manifest.utils';

function generateManifestResponse() {
  const manifest = generateCampaignManifest();

  return {
    ...manifest,
    start_date: manifest.start_date.toISOString(),
    end_date: manifest.end_date.toISOString(),
  };
}

const MANIFEST_RESPONSE_KEYS = Object.keys(generateManifestResponse());

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
      expect(thrownError.message).toBe('Failed to download file');
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
      expect(thrownError.message).toBe('Invalid file hash');
    });

    it.each([
      {
        type: faker.number.int(),
        exchange: faker.lorem.word(),
        daily_volume_target: faker.number.float({ min: -42, max: 0 }),
        pair: generateTradingPair().replace('/', '-'),
        fund_token: faker.string.alpha({ length: 11 }),
        // dates are not in ISO format
        start_date: faker.date.recent().toDateString(),
        end_date: faker.date.future().toDateString(),
      },
      // start date is later than end date
      Object.assign(generateManifestResponse(), {
        start_date: faker.date.soon().toISOString(),
        end_date: faker.date.recent().toISOString(),
      }),
      // equal dates
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
      ...(() => {
        const invalidResponses = [];

        for (const key of MANIFEST_RESPONSE_KEYS) {
          const response = generateManifestResponse();
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          delete response[key];
          invalidResponses.push(response);
        }
        return invalidResponses;
      })(),
    ])(
      'should throw when invalid manifest schema [%#]',
      async (manifestResponse) => {
        const manifest = JSON.stringify(manifestResponse);
        let thrownError;
        try {
          manifestUtils.validateSchema(manifest);
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Invalid manifest schema');
      },
    );

    it('should validate manifest', async () => {
      const mockedManifest = generateManifestResponse();

      const manifest = manifestUtils.validateSchema(
        JSON.stringify(mockedManifest),
      );

      expect(manifest).toEqual({
        ...mockedManifest,
        start_date: new Date(mockedManifest.start_date),
        end_date: new Date(mockedManifest.end_date),
      });
    });

    it('should validate manifest and strip unknown fields', async () => {
      const strippedManifest = generateManifestResponse();
      const manifestWithExtra = {
        ...strippedManifest,
        unknown_field: faker.string.sample(),
      };

      const manifest = manifestUtils.validateSchema(
        JSON.stringify(manifestWithExtra),
      );

      expect(manifest).toEqual({
        ...strippedManifest,
        start_date: new Date(strippedManifest.start_date),
        end_date: new Date(strippedManifest.end_date),
      });
    });
  });
});
