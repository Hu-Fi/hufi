import * as crypto from 'crypto';

import { faker } from '@faker-js/faker';
import nock from 'nock';

import { generateTradingPair } from '@/modules/exchange/fixtures';

import {
  generateManifestResponse,
  generateMarketMakingCampaignManifest,
  generateHoldingCampaignManifest,
} from './fixtures';
import * as manifestUtils from './manifest.utils';
import { CampaignType } from './types';

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

    it('should download manifest and return when hash is valid', async () => {
      const mockedManifest = JSON.stringify(generateManifestResponse());
      const mockedManifestHash = crypto
        .createHash('sha1')
        .update(mockedManifest)
        .digest('hex');
      const scope = nock(manifestUrl).get('/').reply(200, mockedManifest);

      const manifest = await manifestUtils.downloadCampaignManifest(
        manifestUrl,
        mockedManifestHash,
      );

      scope.done();

      expect(manifest).toBe(mockedManifest);
    });
  });

  describe('validateBaseSchema', () => {
    const MANIFEST_RESPONSE_KEYS = Object.keys(generateManifestResponse());

    it.each([
      // all properties are invalid format
      {
        type: faker.string.symbol(),
        exchange: faker.string.symbol(),
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
      'should throw when invalid base manifest schema [%#]',
      async (manifestResponse) => {
        const manifest = JSON.stringify(manifestResponse);
        let thrownError;
        try {
          manifestUtils.validateBaseSchema(manifest);
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Invalid manifest schema');
      },
    );

    it('should validate base manifest schema', async () => {
      const mockedManifest = generateManifestResponse();

      const manifest = manifestUtils.validateBaseSchema(
        JSON.stringify(mockedManifest),
      );

      expect(manifest).toEqual({
        ...mockedManifest,
        start_date: new Date(mockedManifest.start_date),
        end_date: new Date(mockedManifest.end_date),
      });
    });

    it('should validate base manifest and keep unknown fields', async () => {
      const strippedManifest = generateManifestResponse();
      const manifestWithExtra = {
        ...strippedManifest,
        unknown_field: faker.string.sample(),
      };

      const manifest = manifestUtils.validateBaseSchema(
        JSON.stringify(manifestWithExtra),
      );

      expect(manifest).toEqual({
        ...manifestWithExtra,
        start_date: new Date(strippedManifest.start_date),
        end_date: new Date(strippedManifest.end_date),
      });
    });
  });

  describe('assertValidMarketMakingCampaignManifest', () => {
    const validManifest = generateMarketMakingCampaignManifest();

    it.each([
      {
        ...validManifest,
      },
      Object.assign({}, validManifest, {
        pair: `1${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 8 }),
        })}2/3${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 8 }),
        })}4`,
      }),
    ])('should not throw for valid manifest [%#]', (testManifest) => {
      expect(
        manifestUtils.assertValidMarketMakingCampaignManifest(testManifest),
      ).toBeUndefined();
    });

    it.each([
      // invalid (lowercased) type
      Object.assign({}, validManifest, {
        type: CampaignType.MARKET_MAKING.toLowerCase(),
      }),
      // invalid trading pair symbol
      Object.assign({}, validManifest, {
        pair: generateTradingPair().replace('/', '-'),
      }),
      // token symbol instead of trading pair
      Object.assign({}, validManifest, {
        pair: faker.finance.currencyCode(),
      }),
      // lowercase pair
      Object.assign({}, validManifest, {
        pair: generateTradingPair().toLowerCase(),
      }),
      // invalid volume target
      Object.assign({}, validManifest, {
        daily_volume_target: faker.number.int({ min: -42, max: 0 }),
      }),
      // missing volume target
      Object.assign({}, validManifest, {
        daily_volume_target: undefined,
      }),
    ])('should throw when invalid manifest schema [%#]', async (manifest) => {
      let thrownError;
      try {
        manifestUtils.assertValidMarketMakingCampaignManifest(manifest);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'Invalid market making campaign manifest schema',
      );
    });
  });

  describe('assertValidHoldingCampaignManifest', () => {
    const validManifest = generateHoldingCampaignManifest();

    it.each([
      { ...validManifest },
      Object.assign({}, validManifest, {
        symbol: `5${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 8 }),
        })}6`,
      }),
    ])('should not throw for valid manifest [%#]', (testManifest) => {
      expect(
        manifestUtils.assertValidHoldingCampaignManifest(testManifest),
      ).toBeUndefined();
    });

    it.each([
      // invalid (lowercased) type
      Object.assign({}, validManifest, {
        type: CampaignType.HOLDING.toLowerCase(),
      }),
      // trading pair instead of token symbol
      Object.assign({}, validManifest, {
        symbol: generateTradingPair(),
      }),
      // lowercased symbol
      Object.assign({}, validManifest, {
        symbol: faker.finance.currencyCode().toLowerCase(),
      }),
      // invalid balance target
      Object.assign({}, validManifest, {
        daily_balance_target: faker.number.int({ min: -42, max: 0 }),
      }),
      // missing balance target
      Object.assign({}, validManifest, {
        daily_balance_target: undefined,
      }),
    ])('should throw when invalid manifest schema [%#]', async (manifest) => {
      let thrownError;
      try {
        manifestUtils.assertValidHoldingCampaignManifest(manifest);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'Invalid holding campaign manifest schema',
      );
    });
  });
});
