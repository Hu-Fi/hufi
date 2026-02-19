import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClient,
  ExchangesService,
  TakerOrMakerFlag,
  Trade,
  TradingSide,
} from '@/modules/exchanges';
import { generateTrade } from '@/modules/exchanges/fixtures';

import {
  generateMarketMakingCheckerSetup,
  generateParticipantInfo,
} from './fixtures';
import { MarketMakingProgressChecker } from './market-making';
import { CampaignProgressCheckerSetup, ParticipantInfo } from './types';

class TestCampaignProgressChecker extends MarketMakingProgressChecker {
  override ethDepositAddresses = new Set<string>();

  override calculateTradeScore(trade: Trade): number {
    return super.calculateTradeScore(trade);
  }
}

const mockedExchangesService = createMock<ExchangesService>();
const mockedExchangeApiClient = createMock<ExchangeApiClient>();

const fetchMyTrades = jest.fn();
async function* fetchMyTradesGenerator() {
  do {
    const result = await fetchMyTrades();

    if (result === undefined || result.length === 0) {
      break;
    } else {
      yield result;
    }
  } while (true);
}

describe('MarketMakingProgressChecker', () => {
  beforeEach(() => {
    mockedExchangesService.getClientForUser.mockResolvedValue(
      mockedExchangeApiClient,
    );
    mockedExchangeApiClient.fetchMyTrades.mockImplementation(
      fetchMyTradesGenerator,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
      generateMarketMakingCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  describe('calculateTradeScore', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
      generateMarketMakingCheckerSetup(),
    );

    it.each(Object.values(TradingSide))(
      'should return proper score for maker %s',
      (side) => {
        const trade = generateTrade({
          takerOrMaker: TakerOrMakerFlag.MAKER,
          side,
        });

        const score = resultsChecker['calculateTradeScore'](trade);

        expect(score).toBe(trade.cost);
      },
    );

    it('should return proper score for taker buy', () => {
      const trade = generateTrade({
        takerOrMaker: TakerOrMakerFlag.TAKER,
        side: TradingSide.BUY,
      });

      const score = resultsChecker.calculateTradeScore(trade);

      expect(score).toBe(trade.cost * 0.42);
    });

    it('should return proper score for taker sell', () => {
      const trade = generateTrade({
        takerOrMaker: TakerOrMakerFlag.TAKER,
        side: TradingSide.SELL,
      });

      const score = resultsChecker.calculateTradeScore(trade);

      expect(score).toBe(trade.cost * 0.1);
    });
  });

  describe('checkForParticipant', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;
    let participantInfo: ParticipantInfo;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateMarketMakingCheckerSetup();
      participantInfo = generateParticipantInfo({
        joinedAt: progressCheckerSetup.periodStart,
      });

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangesService,
        progressCheckerSetup,
      );
    });

    it('should properly init api client and iterator for trades', async () => {
      const anytime = faker.date.anytime();

      const setup = generateMarketMakingCheckerSetup({
        periodStart: anytime,
        periodEnd: anytime,
      });

      const resultsChecker = new TestCampaignProgressChecker(
        mockedExchangesService,
        setup,
      );

      const result = await resultsChecker.checkForParticipant(participantInfo);

      expect(result).toEqual({
        abuseDetected: false,
        total_volume: 0,
        score: 0,
      });

      expect(mockedExchangesService.getClientForUser).toHaveBeenCalledTimes(1);
      expect(mockedExchangesService.getClientForUser).toHaveBeenCalledWith(
        participantInfo.id,
        setup.exchangeName,
      );

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledWith(
        setup.symbol,
        Math.max(
          setup.periodStart.valueOf(),
          participantInfo.joinedAt.valueOf(),
        ),
        setup.periodEnd.valueOf(),
      );
    });

    it('should return zeros when no trades found', async () => {
      fetchMyTrades.mockResolvedValueOnce([]);

      const result = await resultsChecker.checkForParticipant(participantInfo);

      expect(result).toEqual({
        abuseDetected: false,
        total_volume: 0,
        score: 0,
      });
    });

    it('should iterate through all trades', async () => {
      const nTradesPerPage = faker.number.int({ min: 2, max: 4 });

      const pages = Array.from({ length: 2 }, () =>
        Array.from({ length: nTradesPerPage }, () => generateTrade()),
      );
      for (const page of pages) {
        fetchMyTrades.mockResolvedValueOnce(page);
      }

      await resultsChecker.checkForParticipant(participantInfo);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(1);

      /**
       * Extra call under the hood to check if more trades on next page
       */
      expect(fetchMyTrades).toHaveBeenCalledTimes(pages.length + 1);
    });

    it('should paginate through trades starting from join date not setup start', async () => {
      participantInfo.joinedAt = faker.date.between({
        from: progressCheckerSetup.periodStart.valueOf() + 1,
        to: progressCheckerSetup.periodEnd.valueOf() - 1,
      });
      fetchMyTrades.mockResolvedValueOnce([]);

      await resultsChecker.checkForParticipant(participantInfo);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledWith(
        progressCheckerSetup.symbol,
        participantInfo.joinedAt.valueOf(),
        progressCheckerSetup.periodEnd.valueOf(),
      );
    });
  });

  describe('abuse detection', () => {
    const progressCheckerSetup = generateMarketMakingCheckerSetup();
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
      progressCheckerSetup,
    );

    beforeEach(() => {
      resultsChecker.ethDepositAddresses.clear();
    });

    it('should return zeros when abuse detected', async () => {
      const abuseAddrress = faker.finance.ethereumAddress();
      mockedExchangeApiClient.fetchDepositAddress.mockResolvedValueOnce(
        abuseAddrress,
      );
      resultsChecker.ethDepositAddresses.add(abuseAddrress);

      fetchMyTrades.mockResolvedValueOnce([generateTrade()]);

      const result = await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );
      expect(result.abuseDetected).toBe(true);
      expect(result.score).toBe(0);
      expect(result.total_volume).toBe(0);
      expect(fetchMyTrades).toHaveBeenCalledTimes(0);
    });
  });

  describe('meta data collection', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateMarketMakingCheckerSetup();

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangesService,
        progressCheckerSetup,
      );
    });

    it('should collect total volume for all checked participants', async () => {
      mockedExchangeApiClient.fetchDepositAddress.mockImplementation(async () =>
        faker.finance.ethereumAddress(),
      );
      const nParticipants = faker.number.int({ min: 2, max: 5 });

      let expectedTotalVolume = 0;
      for (let i = 0; i < nParticipants; i += 1) {
        const trade = generateTrade();
        fetchMyTrades.mockResolvedValueOnce([trade]);
        expectedTotalVolume += trade.cost;

        await resultsChecker.checkForParticipant(
          generateParticipantInfo({
            joinedAt: progressCheckerSetup.periodStart,
          }),
        );
      }

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_volume).toBe(expectedTotalVolume);
    });

    it('should not count volume of abuse participants', async () => {
      mockedExchangeApiClient.fetchDepositAddress.mockResolvedValue(
        faker.finance.ethereumAddress(),
      );

      const normalTrades = [generateTrade(), generateTrade()];
      fetchMyTrades.mockResolvedValueOnce(normalTrades);
      fetchMyTrades.mockResolvedValueOnce([]); // last page for first participant

      fetchMyTrades.mockResolvedValueOnce([generateTrade()]);
      fetchMyTrades.mockResolvedValueOnce([]); // last page for second participant

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );
      await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_volume).toBe(normalResult.total_volume);
    });
  });
});
