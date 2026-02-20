import * as crypto from 'crypto';

import { faker } from '@faker-js/faker';
import nock from 'nock';

import { ChainIds } from '@/common/constants';

import {
  generateRawIntermediateResult,
  generateIntermediateResultsData,
  generateManifest,
  generateParticipantOutcome,
} from './fixtures';
import * as payoutsUtils from './payouts.utils';
import { CampaignType } from './types';

function calculateIntermediateResultsHash(data: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

describe('payouts utils', () => {
  afterAll(() => {
    nock.restore();
  });

  describe('retrieveCampaignManifest', () => {
    describe('manifest string', () => {
      it('should return parsed manifest if it is a string', async () => {
        const manifest = generateManifest(CampaignType.MARKET_MAKING);

        const result = await payoutsUtils.retrieveCampaignManifest(
          JSON.stringify(manifest),
          faker.string.hexadecimal(),
        );

        expect(result).toEqual(manifest);
      });
    });

    describe('manifest url', () => {
      let manfestUrl: string;

      beforeEach(() => {
        manfestUrl = faker.internet.url();
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should throw when manifest not found', async () => {
        const scope = nock(manfestUrl).get('/').reply(404);

        let thrownError;
        try {
          await payoutsUtils.retrieveCampaignManifest(
            manfestUrl,
            faker.string.hexadecimal(),
          );
        } catch (error) {
          thrownError = error;
        }

        scope.done();

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Failed to download file');
      });

      it('should throw when invalid manfest hash', async () => {
        const mockedManifest = generateManifest(CampaignType.MARKET_MAKING);
        const invalidHash = faker.string.hexadecimal();
        const scope = nock(manfestUrl).get('/').reply(200, mockedManifest);

        let thrownError;
        try {
          await payoutsUtils.retrieveCampaignManifest(manfestUrl, invalidHash);
        } catch (error) {
          thrownError = error;
        }

        scope.done();

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Invalid file hash');
      });

      it('should download manifest and return when hash is valid', async () => {
        const mockedManifest = generateManifest(CampaignType.MARKET_MAKING);

        const mockedManifestHash = crypto
          .createHash('sha1')
          .update(JSON.stringify(mockedManifest))
          .digest('hex');
        const scope = nock(manfestUrl).get('/').reply(200, mockedManifest);

        const manifest = await payoutsUtils.retrieveCampaignManifest(
          manfestUrl,
          mockedManifestHash,
        );

        scope.done();

        expect(manifest).toEqual(mockedManifest);
      });

      it('should throw for competitive manifest when rewards distribution sum is greater than 100', async () => {
        const mockedManifest = {
          ...generateManifest(CampaignType.COMPETITIVE_MARKET_MAKING),
          type: CampaignType.COMPETITIVE_MARKET_MAKING,
          pair: 'BTC/USDT',
          rewards_distribution: [60, 41],
        };

        const mockedManifestHash = crypto
          .createHash('sha1')
          .update(JSON.stringify(mockedManifest))
          .digest('hex');
        const scope = nock(manfestUrl).get('/').reply(200, mockedManifest);

        let thrownError;
        try {
          await payoutsUtils.retrieveCampaignManifest(
            manfestUrl,
            mockedManifestHash,
          );
        } catch (error) {
          thrownError = error;
        }

        scope.done();

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Invalid campaign manifest');
      });

      it('should accept competitive manifest when rewards distribution sum is less or equal to 100', async () => {
        const mockedManifest = {
          ...generateManifest(CampaignType.COMPETITIVE_MARKET_MAKING),
          type: CampaignType.COMPETITIVE_MARKET_MAKING,
          pair: 'BTC/USDT',
          rewards_distribution: [60, 40],
        };

        const mockedManifestHash = crypto
          .createHash('sha1')
          .update(JSON.stringify(mockedManifest))
          .digest('hex');
        const scope = nock(manfestUrl).get('/').reply(200, mockedManifest);

        const manifest = await payoutsUtils.retrieveCampaignManifest(
          manfestUrl,
          mockedManifestHash,
        );

        scope.done();

        expect(manifest).toEqual({
          ...mockedManifest,
          start_date: new Date(mockedManifest.start_date),
          end_date: new Date(mockedManifest.end_date),
        });
      });
    });
  });

  describe('downloadIntermediateResults', () => {
    const INTERMEDIATE_RESULTS_KEYS = Object.keys(
      generateIntermediateResultsData(),
    );

    let intermediateResultsUrl: string;

    beforeEach(() => {
      intermediateResultsUrl = faker.internet.url();
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should throw when intermediate results not found', async () => {
      const scope = nock(intermediateResultsUrl).get('/').reply(404);

      let thrownError;
      try {
        await payoutsUtils.downloadIntermediateResults(
          intermediateResultsUrl,
          faker.string.hexadecimal(),
        );
      } catch (error) {
        thrownError = error;
      }

      scope.done();

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Failed to download file');
    });

    it('should throw when invalid intermediate results hash', async () => {
      const mockedIntermediateResults = generateIntermediateResultsData();
      const invalidHash = faker.string.hexadecimal();
      const scope = nock(intermediateResultsUrl)
        .get('/')
        .reply(200, mockedIntermediateResults);

      let thrownError;
      try {
        await payoutsUtils.downloadIntermediateResults(
          intermediateResultsUrl,
          invalidHash,
        );
      } catch (error) {
        thrownError = error;
      }

      scope.done();

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('Invalid file hash');
    });

    it('should download intermediate results and return when hash is valid', async () => {
      const mockedIntermediateResults = generateIntermediateResultsData();

      const mockedIntermediateResultsHash = calculateIntermediateResultsHash(
        mockedIntermediateResults,
      );
      const scope = nock(intermediateResultsUrl)
        .get('/')
        .reply(200, mockedIntermediateResults);

      const intermediateResults =
        await payoutsUtils.downloadIntermediateResults(
          intermediateResultsUrl,
          mockedIntermediateResultsHash,
        );

      scope.done();

      expect(intermediateResults).toEqual(mockedIntermediateResults);
    });

    it('should download intermediate results and keep unknown fields', async () => {
      const mockedIntermediateResults = generateIntermediateResultsData();
      const resultsWithExtra = {
        ...mockedIntermediateResults,
        [faker.string.sample()]: faker.number.float(),
      };
      const mockedIntermediateResultsHash =
        calculateIntermediateResultsHash(resultsWithExtra);
      const scope = nock(intermediateResultsUrl)
        .get('/')
        .reply(200, resultsWithExtra);

      const intermediateResults =
        await payoutsUtils.downloadIntermediateResults(
          intermediateResultsUrl,
          mockedIntermediateResultsHash,
        );

      scope.done();

      expect(intermediateResults).toEqual(resultsWithExtra);
    });

    it('should download intermediate results and keep reserved funds as string', async () => {
      const mockedRawIntermediateResult = generateRawIntermediateResult();
      mockedRawIntermediateResult.reserved_funds =
        mockedRawIntermediateResult.reserved_funds.toString();

      const mockedIntermediateResults = {
        ...generateIntermediateResultsData(),
        results: [mockedRawIntermediateResult],
      };
      const mockedIntermediateResultsHash = calculateIntermediateResultsHash(
        mockedIntermediateResults,
      );
      const scope = nock(intermediateResultsUrl)
        .get('/')
        .reply(200, mockedIntermediateResults);

      const intermediateResults =
        await payoutsUtils.downloadIntermediateResults(
          intermediateResultsUrl,
          mockedIntermediateResultsHash,
        );

      scope.done();

      expect(intermediateResults.results[0].reserved_funds).toBe(
        mockedRawIntermediateResult.reserved_funds,
      );
    });

    it('should download intermediate results and pass validation when score is 0', async () => {
      const mockedRawIntermediateResult = generateRawIntermediateResult();
      const mockedParticipantOutcome = generateParticipantOutcome();
      mockedParticipantOutcome.score = 0;

      mockedRawIntermediateResult.participants_outcomes_batches.push({
        id: faker.string.uuid(),
        results: [mockedParticipantOutcome],
      });

      const mockedIntermediateResults = {
        ...generateIntermediateResultsData(),
        results: [mockedRawIntermediateResult],
      };
      const mockedIntermediateResultsHash = calculateIntermediateResultsHash(
        mockedIntermediateResults,
      );
      const scope = nock(intermediateResultsUrl)
        .get('/')
        .reply(200, mockedIntermediateResults);

      const intermediateResults =
        await payoutsUtils.downloadIntermediateResults(
          intermediateResultsUrl,
          mockedIntermediateResultsHash,
        );

      scope.done();

      expect(
        intermediateResults.results[0].participants_outcomes_batches[0]
          .results[0].score,
      ).toBe(0);
    });

    it.each([
      // invalid chain id format
      {
        ...generateIntermediateResultsData(),
        chain_id: faker.helpers.arrayElement(ChainIds).toString(),
      },
      // missing keys
      ...(() => {
        const invalidResults = [];

        for (const key of INTERMEDIATE_RESULTS_KEYS) {
          const intermediateResultsData = generateIntermediateResultsData();
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          delete intermediateResultsData[key];
          invalidResults.push(intermediateResultsData);
        }
        return invalidResults;
      })(),
      // invalid from date format
      (() => {
        const intermediateResult = generateRawIntermediateResult();
        Object.assign(intermediateResult, {
          from: new Date(intermediateResult.from).toDateString(),
        });

        return {
          ...generateIntermediateResultsData(),
          results: [intermediateResult],
        };
      })(),
      // invalid to date format
      (() => {
        const intermediateResult = generateRawIntermediateResult();
        Object.assign(intermediateResult, {
          to: new Date(intermediateResult.to).toDateString(),
        });

        return {
          ...generateIntermediateResultsData(),
          results: [intermediateResult],
        };
      })(),
      // equal dates
      (() => {
        const equalDate = faker.date.anytime();
        const intermediateResult = generateRawIntermediateResult();

        return {
          ...generateIntermediateResultsData(),
          results: [
            {
              ...intermediateResult,
              from: equalDate.toISOString(),
              to: equalDate.toISOString(),
            },
          ],
        };
      })(),
      // unsafe number in reserved funds
      {
        ...generateIntermediateResultsData(),
        results: [
          {
            ...generateRawIntermediateResult(),
            reserved_funds: Number.MAX_SAFE_INTEGER + 42,
          },
        ],
      },
      // negative reserved funds number
      {
        ...generateIntermediateResultsData(),
        results: [
          {
            ...generateRawIntermediateResult(),
            reserved_funds: faker.number.float({
              min: Number.MIN_SAFE_INTEGER,
              max: 0,
            }),
          },
        ],
      },
      // negative reserved funds string
      {
        ...generateIntermediateResultsData(),
        results: [
          {
            ...generateRawIntermediateResult(),
            reserved_funds: faker.number
              .float({
                min: Number.MIN_SAFE_INTEGER,
                max: 0,
              })
              .toString(),
          },
        ],
      },
      // invalid batch id
      {
        ...generateIntermediateResultsData(),
        results: [
          {
            ...generateRawIntermediateResult(),
            participants_outcomes_batches: [
              {
                id: faker.string.ulid(),
                results: [generateParticipantOutcome()],
              },
            ],
          },
        ],
      },
      // score is string
      {
        ...generateIntermediateResultsData(),
        results: [
          {
            ...generateRawIntermediateResult(),
            participants_outcomes_batches: [
              {
                id: faker.string.uuid(),
                results: [
                  {
                    ...generateParticipantOutcome(),
                    score: faker.number.float().toString(),
                  },
                ],
              },
            ],
          },
        ],
      },
      // score is negative
      {
        ...generateIntermediateResultsData(),
        results: [
          {
            ...generateRawIntermediateResult(),
            participants_outcomes_batches: [
              {
                id: faker.string.uuid(),
                results: [
                  {
                    ...generateParticipantOutcome(),
                    score: faker.number.float({
                      min: Number.MIN_SAFE_INTEGER,
                      max: 0,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
    ])(
      'should throw when invalid intermediate results schema [%#]',
      async (mockedIntermediateResults) => {
        const mockedIntermediateResultsHash = calculateIntermediateResultsHash(
          mockedIntermediateResults,
        );
        const scope = nock(intermediateResultsUrl)
          .get('/')
          .reply(200, mockedIntermediateResults);

        let thrownError;
        try {
          await payoutsUtils.downloadIntermediateResults(
            intermediateResultsUrl,
            mockedIntermediateResultsHash,
          );
        } catch (error) {
          thrownError = error;
        }

        scope.done();

        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('Invalid intermediate results schema');
      },
    );
  });
});
