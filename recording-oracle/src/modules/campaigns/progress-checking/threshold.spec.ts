import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
} from '@/modules/exchange';
import { generateAccountBalance } from '@/modules/exchange/fixtures';

import {
  generateThresholdCheckerSetup,
  generateParticipantAuthKeys,
} from './fixtures';
import { ThresholdProgressChecker } from './threshold';
import { CampaignProgressCheckerSetup, ParticipantAuthKeys } from './types';

const mockedExchangeApiClient = createMock<ExchangeApiClient>();
const mockedExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();

class TestCampaignProgressChecker extends ThresholdProgressChecker {
  override ethDepositAddresses = new Set<string>();
}

describe('ThresholdProgressChecker', () => {
  beforeEach(() => {
    mockedExchangeApiClientFactory.create.mockReturnValue(
      mockedExchangeApiClient,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      generateThresholdCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  describe('checkForParticipant', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;
    let participantAuthKeys: ParticipantAuthKeys;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateThresholdCheckerSetup();
      participantAuthKeys = generateParticipantAuthKeys();

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        progressCheckerSetup,
      );

      mockedExchangeApiClient.fetchBalance.mockResolvedValue(
        generateAccountBalance([
          faker.finance.currencyCode(),
          faker.finance.currencyCode(),
        ]),
      );
    });

    it('should properly init api client', async () => {
      const resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        progressCheckerSetup,
      );

      await resultsChecker.checkForParticipant(participantAuthKeys);

      expect(mockedExchangeApiClientFactory.create).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClientFactory.create).toHaveBeenCalledWith(
        progressCheckerSetup.exchangeName,
        participantAuthKeys,
      );
    });

    it('should return zeros when no token on balance', async () => {
      const result = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );

      expect(result).toEqual({
        abuseDetected: false,
        score: 0,
        token_balance: 0,
      });
    });

    it('should return correct score and balance when account balance has it', async () => {
      const mockedAccountBalance = generateAccountBalance([
        progressCheckerSetup.symbol,
      ]);
      mockedExchangeApiClient.fetchBalance.mockResolvedValueOnce(
        mockedAccountBalance,
      );

      const result =
        await resultsChecker.checkForParticipant(participantAuthKeys);

      const expectedBalance =
        mockedAccountBalance.total[progressCheckerSetup.symbol];
      const expectedScore =
        mockedAccountBalance.total[progressCheckerSetup.symbol] >=
        (progressCheckerSetup.minimumBalanceTarget as number)
          ? 1
          : 0;
      expect(result.abuseDetected).toBe(false);
      expect(result.score).toBe(expectedScore);
      expect(result.token_balance).toBe(expectedBalance);
    });
  });

  describe('abuse detection', () => {
    const progressCheckerSetup = generateThresholdCheckerSetup();
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      progressCheckerSetup,
    );

    beforeEach(() => {
      resultsChecker.ethDepositAddresses.clear();
    });

    it('should return zeros if abuse detected', async () => {
      const abuseAddrress = faker.finance.ethereumAddress();
      mockedExchangeApiClient.fetchDepositAddress.mockResolvedValueOnce(
        abuseAddrress,
      );
      resultsChecker.ethDepositAddresses.add(abuseAddrress);

      const mockedAccountBalance = generateAccountBalance([
        progressCheckerSetup.symbol,
      ]);
      mockedExchangeApiClient.fetchBalance.mockResolvedValue(
        mockedAccountBalance,
      );
      const abuseResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );

      expect(abuseResult.abuseDetected).toBe(true);
      expect(abuseResult.score).toBe(0);
      expect(abuseResult.token_balance).toBe(0);
    });
  });

  describe('meta data collection', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateThresholdCheckerSetup();

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        progressCheckerSetup,
      );
    });

    it('should collect total balance for all checked participants', async () => {
      const nParticipants = faker.number.int({ min: 2, max: 5 });

      let expectedTotalBalance = 0;
      let expectedTotalScore = 0;
      for (let i = 0; i < nParticipants; i += 1) {
        const accountBalance = generateAccountBalance([
          progressCheckerSetup.symbol,
        ]);
        mockedExchangeApiClient.fetchDepositAddress.mockResolvedValueOnce(
          faker.finance.ethereumAddress(),
        );
        mockedExchangeApiClient.fetchBalance.mockResolvedValueOnce(
          accountBalance,
        );
        expectedTotalBalance +=
          accountBalance.total[progressCheckerSetup.symbol];

        const expectedScore =
          accountBalance.total[progressCheckerSetup.symbol] >=
          (progressCheckerSetup.minimumBalanceTarget as number)
            ? 1
            : 0;
        expectedTotalScore += expectedScore;

        await resultsChecker.checkForParticipant(generateParticipantAuthKeys());
      }

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_balance).toBe(expectedTotalBalance);
      expect(meta.total_score).toBe(expectedTotalScore);
    });

    it('should not count balance of abuse participants', async () => {
      mockedExchangeApiClient.fetchDepositAddress.mockResolvedValue(
        faker.finance.ethereumAddress(),
      );
      const mockAccountBalance = generateAccountBalance([
        progressCheckerSetup.symbol,
      ]);
      mockedExchangeApiClient.fetchBalance.mockResolvedValue(
        mockAccountBalance,
      );

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );
      await resultsChecker.checkForParticipant(generateParticipantAuthKeys());

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_balance).toBe(normalResult.token_balance);
      expect(meta.total_score).toBe(normalResult.score);
    });
  });
});
