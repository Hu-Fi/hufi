import { faker } from '@faker-js/faker';
import nock from 'nock';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import { CampaignType } from '@/common/constants';
import * as cryptoUtils from '@/common/utils/crypto';
import { generateTradingPair } from '@/modules/exchanges/fixtures';

import {
  generateCompetitiveMarketMakingCampaignManifest,
  generateHoldingCampaignManifest,
  generateManifestResponse,
  generateMarketMakingCampaignManifest,
  generateThresholdampaignManifest,
  generateThresholdMarketMakingCampaignManifest,
} from './fixtures';
import * as manifestUtils from './manifest.utils';

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

    test('should throw when manifest not found', async () => {
      const scope = nock(manifestUrl).get('/').reply(404);

      let thrownError: any;
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

    test('should throw when invalid manifest hash', async () => {
      const mockedManifest = generateManifestResponse();
      const invalidHash = faker.string.hexadecimal();
      const scope = nock(manifestUrl).get('/').reply(200, mockedManifest);

      let thrownError: any;
      try {
        await manifestUtils.downloadCampaignManifest(manifestUrl, invalidHash);
      } catch (error) {
        thrownError = error;
      }

      scope.done();

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Invalid file hash');
    });

    test('should download manifest and return when hash is valid', async () => {
      const mockedManifest = JSON.stringify(generateManifestResponse());
      const mockedManifestHash = cryptoUtils.hashString(mockedManifest, 'sha1');
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

    test.each([
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
        let thrownError: any;
        try {
          manifestUtils.validateBaseSchema(manifest);
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Invalid manifest schema');
      },
    );

    test('should validate base manifest schema', async () => {
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

    test('should validate base manifest and keep unknown fields', async () => {
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

    test.each([
      {
        ...validManifest,
      },
      Object.assign({}, validManifest, {
        pair: `B${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 9 }),
        })}/Q${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 2, max: 9 }),
        })}`,
      }),
    ])('should not throw for valid manifest [%#]', (testManifest) => {
      expect(
        manifestUtils.assertValidMarketMakingCampaignManifest(testManifest),
      ).toBeUndefined();
    });

    test.each([
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
      // too short base symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 1,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 10 }),
        })}`,
      }),
      // too short quote symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 2,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 2 }),
        })}`,
      }),
      // too long base symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 11,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 10 }),
        })}`,
      }),
      // too long quote symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 2, max: 10 }),
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: 11,
        })}`,
      }),
      // invalid volume target
      Object.assign({}, validManifest, {
        daily_volume_target: faker.number.int({ min: -42, max: 0 }),
      }),
      // missing volume target
      Object.assign({}, validManifest, {
        daily_volume_target: undefined,
      }),
      // volume target string
      Object.assign({}, validManifest, {
        daily_volume_target: faker.number.int({ min: 1 }).toString(),
      }),
      // unsafe volume target
      Object.assign({}, validManifest, {
        daily_volume_target: Number.MAX_SAFE_INTEGER + 42,
      }),
    ])('should throw when invalid manifest schema [%#]', async (manifest) => {
      let thrownError: any;
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

    test.each([
      { ...validManifest },
      Object.assign({}, validManifest, {
        symbol: `S${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 9 }),
        })}`,
      }),
    ])('should not throw for valid manifest [%#]', (testManifest) => {
      expect(
        manifestUtils.assertValidHoldingCampaignManifest(testManifest),
      ).toBeUndefined();
    });

    test.each([
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
      // too short symbol
      Object.assign({}, validManifest, {
        symbol: 1,
      }),
      // too long symbol
      Object.assign({}, validManifest, {
        symbol: 11,
      }),
      // invalid balance target
      Object.assign({}, validManifest, {
        daily_balance_target: faker.number.int({ min: -42, max: 0 }),
      }),
      // missing balance target
      Object.assign({}, validManifest, {
        daily_balance_target: undefined,
      }),
      // balance target string
      Object.assign({}, validManifest, {
        daily_balance_target: faker.number.int({ min: 1 }).toString(),
      }),
      // unsafe balance target
      Object.assign({}, validManifest, {
        daily_balance_target: Number.MAX_SAFE_INTEGER + 42,
      }),
    ])('should throw when invalid manifest schema [%#]', async (manifest) => {
      let thrownError: any;
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

  describe('assertValidCompetitiveMarketMakingCampaignManifest', () => {
    const validManifest = generateCompetitiveMarketMakingCampaignManifest();

    test.each([
      { ...validManifest },
      Object.assign({}, validManifest, {
        pair: `B${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 9 }),
        })}/Q${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 2, max: 9 }),
        })}`,
      }),
    ])('should not throw for valid manifest [%#]', (testManifest) => {
      expect(
        manifestUtils.assertValidCompetitiveMarketMakingCampaignManifest(
          testManifest,
        ),
      ).toBeUndefined();
    });

    test.each([
      // invalid (lowercased) type
      Object.assign({}, validManifest, {
        type: CampaignType.COMPETITIVE_MARKET_MAKING.toLowerCase(),
      }),
      // invalid trading pair symbol
      Object.assign({}, validManifest, {
        pair: generateTradingPair().replace('/', ''),
      }),
      // token symbol instead of trading pair
      Object.assign({}, validManifest, {
        pair: faker.finance.currencyCode(),
      }),
      // lowercase pair
      Object.assign({}, validManifest, {
        pair: generateTradingPair().toLowerCase(),
      }),
      // empty rewards distribution
      Object.assign({}, validManifest, {
        rewards_distribution: [],
      }),
      // negative rewards distribution value
      Object.assign({}, validManifest, {
        rewards_distribution: [faker.number.int({ min: -100, max: 0 })],
      }),
      // too short base symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 1,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 10 }),
        })}`,
      }),
      // too short quote symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 2,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 2 }),
        })}`,
      }),
      // too long base symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 11,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 10 }),
        })}`,
      }),
      // too long quote symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 2, max: 10 }),
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: 11,
        })}`,
      }),
      // missing rewards distribution
      Object.assign({}, validManifest, {
        rewards_distribution: undefined,
      }),
      // rewards distribution string value
      Object.assign({}, validManifest, {
        rewards_distribution: [faker.number.int({ min: 1 }).toString()],
      }),
      // negative minimum volume required
      Object.assign({}, validManifest, {
        minimum_volume_required: faker.number.float({ min: -100, max: -1 }),
      }),
      // missing minimum volume required
      Object.assign({}, validManifest, {
        minimum_volume_required: undefined,
      }),
      // minimum volume required string
      Object.assign({}, validManifest, {
        minimum_volume_required: faker.number.int({ min: 1 }).toString(),
      }),
      // rewards distribution sum exceeds 100
      Object.assign({}, validManifest, {
        rewards_distribution: [60, 41],
      }),
    ])('should throw when invalid manifest schema [%#]', async (manifest) => {
      let thrownError: any;
      try {
        manifestUtils.assertValidCompetitiveMarketMakingCampaignManifest(
          manifest,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'Invalid competitive market making campaign manifest schema',
      );
    });

    test('should not throw when rewards distribution sum is less or equal to 100', () => {
      const validDistributionManifest = Object.assign({}, validManifest, {
        rewards_distribution: [50, 30, 20],
      });
      expect(
        manifestUtils.assertValidCompetitiveMarketMakingCampaignManifest({
          ...validDistributionManifest,
        }),
      ).toBeUndefined();

      const validPartialDistributionManifest = Object.assign(
        {},
        validManifest,
        {
          rewards_distribution: [50, 30],
        },
      );
      expect(
        manifestUtils.assertValidCompetitiveMarketMakingCampaignManifest({
          ...validPartialDistributionManifest,
        }),
      ).toBeUndefined();
    });
  });

  describe('assertValidThresholdMarketMakingCampaignManifest', () => {
    const validManifest = generateThresholdMarketMakingCampaignManifest();

    test.each([
      { ...validManifest },
      Object.assign({}, validManifest, {
        pair: `B${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 9 }),
        })}/Q${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 2, max: 9 }),
        })}`,
      }),
    ])('should not throw for valid manifest [%#]', (testManifest) => {
      expect(
        manifestUtils.assertValidThresholdMarketMakingCampaignManifest(
          testManifest,
        ),
      ).toBeUndefined();
    });

    test.each([
      // invalid (lowercased) type
      Object.assign({}, validManifest, {
        type: CampaignType.THRESHOLD_MARKET_MAKING.toLowerCase(),
      }),
      // invalid trading pair symbol
      Object.assign({}, validManifest, {
        pair: generateTradingPair().replace('/', ''),
      }),
      // token symbol instead of trading pair
      Object.assign({}, validManifest, {
        pair: faker.finance.currencyCode(),
      }),
      // lowercase pair
      Object.assign({}, validManifest, {
        pair: generateTradingPair().toLowerCase(),
      }),
      // too short base symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 1,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 10 }),
        })}`,
      }),
      // too short quote symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 2,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 2 }),
        })}`,
      }),
      // too long base symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: 11,
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 3, max: 10 }),
        })}`,
      }),
      // too long quote symbol
      Object.assign({}, validManifest, {
        pair: `${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 2, max: 10 }),
        })}/${faker.string.alphanumeric({
          casing: 'upper',
          length: 11,
        })}`,
      }),
      // invalid minimum volume target
      Object.assign({}, validManifest, {
        minimum_volume_target: faker.number.int({ min: -42, max: 0 }),
      }),
      // missing minimum volume target
      Object.assign({}, validManifest, {
        minimum_volume_target: undefined,
      }),
      // minimum volume target string
      Object.assign({}, validManifest, {
        minimum_volume_target: faker.number.int({ min: 1 }).toString(),
      }),
      // unsafe minimum volume target
      Object.assign({}, validManifest, {
        minimum_volume_target: Number.MAX_SAFE_INTEGER + 42,
      }),
      // max participants string
      Object.assign({}, validManifest, {
        max_participants: faker.number.int({ min: 1 }).toString(),
      }),
      // missing max participants
      Object.assign({}, validManifest, {
        max_participants: undefined,
      }),
      // max participants zero
      Object.assign({}, validManifest, {
        max_participants: 0,
      }),
      // max participants negative
      Object.assign({}, validManifest, {
        max_participants: faker.number.int({ min: -42, max: -1 }),
      }),
      // max participants non-integer
      Object.assign({}, validManifest, {
        max_participants: faker.number.float({ fractionDigits: 3 }),
      }),
    ])('should throw when invalid manifest schema [%#]', async (manifest) => {
      let thrownError: any;
      try {
        manifestUtils.assertValidThresholdMarketMakingCampaignManifest(
          manifest,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'Invalid threshold market making campaign manifest schema',
      );
    });
  });

  describe('assertValidThresholdCampaignManifest', () => {
    const validManifest = generateThresholdampaignManifest();

    test.each([
      Object.assign({}, validManifest, { max_participants: undefined }),
      Object.assign({}, validManifest, {
        max_participants: faker.number.int({ min: 1 }),
      }),
      Object.assign({}, validManifest, {
        symbol: `S${faker.string.alphanumeric({
          casing: 'upper',
          length: faker.number.int({ min: 1, max: 9 }),
        })}`,
      }),
    ])('should not throw for valid manifest [%#]', (testManifest) => {
      expect(
        manifestUtils.assertValidThresholdCampaignManifest(testManifest),
      ).toBeUndefined();
    });

    test.each([
      // invalid (lowercased) type
      Object.assign({}, validManifest, {
        type: CampaignType.THRESHOLD.toLowerCase(),
      }),
      // trading pair instead of token symbol
      Object.assign({}, validManifest, {
        symbol: generateTradingPair(),
      }),
      // lowercased symbol
      Object.assign({}, validManifest, {
        symbol: faker.finance.currencyCode().toLowerCase(),
      }),
      // too short symbol
      Object.assign({}, validManifest, {
        symbol: 1,
      }),
      // too long symbol
      Object.assign({}, validManifest, {
        symbol: 11,
      }),
      // invalid minimum balance target
      Object.assign({}, validManifest, {
        minimum_balance_target: faker.number.int({ min: -42, max: 0 }),
      }),
      // missing minimum balance target
      Object.assign({}, validManifest, {
        minimum_balance_target: undefined,
      }),
      // balance target string
      Object.assign({}, validManifest, {
        minimum_balance_target: faker.number.int({ min: 1 }).toString(),
      }),
      // unsafe balance target
      Object.assign({}, validManifest, {
        minimum_balance_target: Number.MAX_SAFE_INTEGER + 42,
      }),
      // max participants string
      Object.assign({}, validManifest, {
        max_participants: faker.number.int({ min: 1 }).toString(),
      }),
      // max participants zero
      Object.assign({}, validManifest, {
        max_participants: 0,
      }),
      // max participants negative
      Object.assign({}, validManifest, {
        max_participants: faker.number.int({ min: -42, max: -1 }),
      }),
      // max participants non-integer
      Object.assign({}, validManifest, {
        max_participants: faker.number.float({ fractionDigits: 3 }),
      }),
    ])('should throw when invalid manifest schema [%#]', async (manifest) => {
      let thrownError: any;
      try {
        manifestUtils.assertValidThresholdCampaignManifest(manifest);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'Invalid threshold campaign manifest schema',
      );
    });
  });
});
