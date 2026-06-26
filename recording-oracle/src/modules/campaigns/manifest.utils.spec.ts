import { faker } from '@faker-js/faker';
import nock from 'nock';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import { CampaignType } from '@/common/constants';
import * as cryptoUtils from '@/common/utils/crypto';
import { generateTradingPair } from '@/modules/exchanges/fixtures';

import {
  generateBaseCampaignManifest,
  generateCompetitiveMarketMakingCampaignManifest,
  generateHoldingCampaignManifest,
  generateManifestResponse,
  generateMarketMakingCampaignManifest,
  generateThresholdampaignManifest,
  generateThresholdMarketMakingCampaignManifest,
} from './fixtures';
import * as manifestUtils from './manifest.utils';
import { CampaignManifestBase } from './types';

const CAMPAIGN_TYPE_TO_UTILS: Record<
  CampaignType,
  {
    generateManifest: () => CampaignManifestBase;
    assertValidManifest: (manifest: CampaignManifestBase) => void;
  }
> = {
  [CampaignType.MARKET_MAKING]: {
    generateManifest: generateMarketMakingCampaignManifest,
    assertValidManifest: manifestUtils.assertValidMarketMakingCampaignManifest,
  },
  [CampaignType.COMPETITIVE_MARKET_MAKING]: {
    generateManifest: generateCompetitiveMarketMakingCampaignManifest,
    assertValidManifest:
      manifestUtils.assertValidCompetitiveMarketMakingCampaignManifest,
  },
  [CampaignType.THRESHOLD_MARKET_MAKING]: {
    generateManifest: generateThresholdMarketMakingCampaignManifest,
    assertValidManifest:
      manifestUtils.assertValidThresholdMarketMakingCampaignManifest,
  },
  [CampaignType.HOLDING]: {
    generateManifest: generateHoldingCampaignManifest,
    assertValidManifest: manifestUtils.assertValidHoldingCampaignManifest,
  },
  [CampaignType.THRESHOLD]: {
    generateManifest: generateThresholdampaignManifest,
    assertValidManifest: manifestUtils.assertValidThresholdCampaignManifest,
  },
};

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

  describe('schema validation', () => {
    describe.each(Object.values(CampaignType))(
      'base schema validation for %s campaign type',
      (campaignType) => {
        const { generateManifest, assertValidManifest } =
          CAMPAIGN_TYPE_TO_UTILS[campaignType];

        test('should not throw for valid manifest', async () => {
          expect(assertValidManifest(generateManifest())).toBeUndefined();
        });

        test.each([
          // lowercased type
          Object.assign(generateManifest(), {
            type: campaignType.toLowerCase(),
          }),
          // dates are not in ISO format
          Object.assign(generateManifest(), {
            start_date: faker.date.recent().toDateString(),
            end_date: faker.date.future().toDateString(),
          }),
          // dates are in numeric format
          Object.assign(generateManifest(), {
            start_date: faker.date.recent().valueOf(),
            end_date: faker.date.future().valueOf(),
          }),
          // too short exchange name
          Object.assign(generateManifest(), {
            exchange: faker.string.alphanumeric({ casing: 'upper', length: 1 }),
          }),
          // start date is later than end date
          Object.assign(generateManifest(), {
            start_date: faker.date.soon().toISOString(),
            end_date: faker.date.recent().toISOString(),
          }),
          // equal dates
          Object.assign(
            generateManifest(),
            (() => {
              const nowIsoString = new Date().toISOString();

              return {
                start_date: nowIsoString,
                end_date: nowIsoString,
              };
            })(),
          ),
          // missing base properties
          ...(() => {
            const invalidManifests = [];

            for (const key of Object.keys(generateBaseCampaignManifest())) {
              const testManifest = generateManifest();
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              delete testManifest[key];
              invalidManifests.push(testManifest);
            }

            return invalidManifests;
          })(),
        ])(
          'should throw when invalid base manifest schema [%$]',
          async (manifest) => {
            let thrownError: any;
            try {
              assertValidManifest(manifest);
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBeInstanceOf(Error);
            expect(thrownError.message).toBe(
              `Invalid ${campaignType} campaign manifest schema`,
            );
          },
        );
      },
    );

    describe('symbol validation', () => {
      describe.each([
        CampaignType.MARKET_MAKING,
        CampaignType.COMPETITIVE_MARKET_MAKING,
        CampaignType.THRESHOLD_MARKET_MAKING,
      ])('trading pair for %s campaign type', (campaignType) => {
        const { generateManifest, assertValidManifest } =
          CAMPAIGN_TYPE_TO_UTILS[campaignType];

        let validManinfest: CampaignManifestBase;

        beforeAll(() => {
          validManinfest = generateManifest();
        });

        test.each([
          // invalid symbol
          generateTradingPair().replace('/', '-'),
          // token symbol instead of trading pair
          faker.finance.currencyCode(),
          // lowercase pair
          generateTradingPair().toLowerCase(),
          // too short base symbol
          `${faker.string.alphanumeric({
            casing: 'upper',
            length: 1,
          })}/${faker.string.alphanumeric({
            casing: 'upper',
            length: faker.number.int({ min: 3, max: 10 }),
          })}`,
          // too short quote symbol
          `${faker.string.alphanumeric({
            casing: 'upper',
            length: 2,
          })}/${faker.string.alphanumeric({
            casing: 'upper',
            length: faker.number.int({ min: 1, max: 2 }),
          })}`,
          // too long base symbol
          `${faker.string.alphanumeric({
            casing: 'upper',
            length: 11,
          })}/${faker.string.alphanumeric({
            casing: 'upper',
            length: faker.number.int({ min: 3, max: 10 }),
          })}`,
          // too long quote symbol
          `${faker.string.alphanumeric({
            casing: 'upper',
            length: faker.number.int({ min: 2, max: 10 }),
          })}/${faker.string.alphanumeric({
            casing: 'upper',
            length: 11,
          })}`,
        ])(
          'should throw when invalid trading pair [%$]',
          async (tradingPair) => {
            let thrownError: any;
            try {
              assertValidManifest(
                Object.assign({}, validManinfest, {
                  pair: tradingPair,
                }),
              );
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBeInstanceOf(Error);
            expect(thrownError.message).toBe(
              `Invalid ${campaignType} campaign manifest schema`,
            );
          },
        );

        test.each([
          // random pair
          generateTradingPair(),
          // min token symbol length
          `B${faker.string.alphanumeric({
            casing: 'upper',
            length: 1,
          })}/Q${faker.string.alphanumeric({
            casing: 'upper',
            length: 2,
          })}`,
          // max token symbol length
          `B${faker.string.alphanumeric({
            casing: 'upper',
            length: 9,
          })}/Q${faker.string.alphanumeric({
            casing: 'upper',
            length: 9,
          })}`,
        ])('should not throw for valid trading pair [%$]', (tradingPair) => {
          expect(
            assertValidManifest(
              Object.assign({}, validManinfest, {
                pair: tradingPair,
              }),
            ),
          ).toBeUndefined();
        });
      });

      describe.each([CampaignType.HOLDING, CampaignType.THRESHOLD])(
        'token symbol for %s campaign type',
        (campaignType) => {
          const { generateManifest, assertValidManifest } =
            CAMPAIGN_TYPE_TO_UTILS[campaignType];

          let validManinfest: CampaignManifestBase;

          beforeAll(() => {
            validManinfest = generateManifest();
          });

          test.each([
            // trading pair instead of token symbol
            generateTradingPair(),
            // lowercased symbol
            faker.finance.currencyCode().toLowerCase(),
            // too short symbol
            faker.string.alphanumeric({ casing: 'upper', length: 1 }),
            // too long symbol
            faker.string.alphanumeric({ casing: 'upper', length: 11 }),
          ])(
            'should throw when invalid token symbol [%$]',
            async (tokenSymbol) => {
              let thrownError: any;
              try {
                assertValidManifest(
                  Object.assign({}, validManinfest, {
                    symbol: tokenSymbol,
                  }),
                );
              } catch (error) {
                thrownError = error;
              }

              expect(thrownError).toBeInstanceOf(Error);
              expect(thrownError.message).toBe(
                `Invalid ${campaignType} campaign manifest schema`,
              );
            },
          );

          test.each([
            // random token symbol length
            `S${faker.string.alphanumeric({
              casing: 'upper',
              length: faker.number.int({ min: 1, max: 9 }),
            })}`,
            // min token symbol length
            `S${faker.string.alphanumeric({
              casing: 'upper',
              length: 1,
            })}`,
            // max token symbol length
            `S${faker.string.alphanumeric({
              casing: 'upper',
              length: 9,
            })}`,
          ])('should not throw for valid token symbol [%$]', (tradingPair) => {
            expect(
              assertValidManifest(
                Object.assign({}, validManinfest, {
                  symbol: tradingPair,
                }),
              ),
            ).toBeUndefined();
          });
        },
      );
    });

    describe('campaign type specific props validation', () => {
      describe('assertValidMarketMakingCampaignManifest', () => {
        const validManifest = generateMarketMakingCampaignManifest();

        test('should not throw for valid manifest', () => {
          expect(
            manifestUtils.assertValidMarketMakingCampaignManifest(
              validManifest,
            ),
          ).toBeUndefined();
        });

        test.each([
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
        ])(
          'should throw when invalid manifest schema [%$]',
          async (manifest) => {
            let thrownError: any;
            try {
              manifestUtils.assertValidMarketMakingCampaignManifest(manifest);
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBeInstanceOf(Error);
            expect(thrownError.message).toBe(
              'Invalid MARKET_MAKING campaign manifest schema',
            );
          },
        );
      });

      describe('assertValidCompetitiveMarketMakingCampaignManifest', () => {
        const validManifest = generateCompetitiveMarketMakingCampaignManifest();

        test('should not throw for valid manifest', () => {
          expect(
            manifestUtils.assertValidCompetitiveMarketMakingCampaignManifest(
              validManifest,
            ),
          ).toBeUndefined();
        });

        test.each([
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
        ])(
          'should throw when invalid manifest schema [%$]',
          async (manifest) => {
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
              'Invalid COMPETITIVE_MARKET_MAKING campaign manifest schema',
            );
          },
        );

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

        test('should not throw for valid manifest', () => {
          expect(
            manifestUtils.assertValidThresholdMarketMakingCampaignManifest(
              validManifest,
            ),
          ).toBeUndefined();
        });

        test.each([
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
        ])(
          'should throw when invalid manifest schema [%$]',
          async (manifest) => {
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
              'Invalid THRESHOLD_MARKET_MAKING campaign manifest schema',
            );
          },
        );
      });

      describe('assertValidHoldingCampaignManifest', () => {
        const validManifest = generateHoldingCampaignManifest();

        test('should not throw for valid manifest', () => {
          expect(
            manifestUtils.assertValidHoldingCampaignManifest(validManifest),
          ).toBeUndefined();
        });

        test.each([
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
        ])(
          'should throw when invalid manifest schema [%$]',
          async (manifest) => {
            let thrownError: any;
            try {
              manifestUtils.assertValidHoldingCampaignManifest(manifest);
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBeInstanceOf(Error);
            expect(thrownError.message).toBe(
              'Invalid HOLDING campaign manifest schema',
            );
          },
        );
      });

      describe('assertValidThresholdCampaignManifest', () => {
        const validManifest = generateThresholdampaignManifest();

        test('should not throw for valid manifest', () => {
          expect(
            manifestUtils.assertValidThresholdCampaignManifest(validManifest),
          ).toBeUndefined();
        });

        test.each([
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
        ])(
          'should throw when invalid manifest schema [%$]',
          async (manifest) => {
            let thrownError: any;
            try {
              manifestUtils.assertValidThresholdCampaignManifest(manifest);
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).toBeInstanceOf(Error);
            expect(thrownError.message).toBe(
              'Invalid THRESHOLD campaign manifest schema',
            );
          },
        );
      });
    });
  });
});
