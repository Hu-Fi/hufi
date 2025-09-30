import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
} from '@/modules/exchange';
import { generateAccountBalance } from '@/modules/exchange/fixtures';

import {
  generateHoldingCheckerSetup,
  generateParticipantAuthKeys,
} from './fixtures';
import { HoldingProgressChecker } from './holding';
import { CampaignProgressCheckerSetup, ParticipantAuthKeys } from './types';

const mockedExchangeApiClient = createMock<ExchangeApiClient>();
const mockedExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();

class TestCampaignProgressChecker extends HoldingProgressChecker {
  override ethDepositAddresses = new Set<string>();
}

describe('HoldingProgressChecker', () => {
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
      generateHoldingCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  describe('checkForParticipant', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;
    let participantAuthKeys: ParticipantAuthKeys;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateHoldingCheckerSetup();
      participantAuthKeys = generateParticipantAuthKeys();

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        progressCheckerSetup,
      );

      mockedExchangeApiClient.fetchBalance.mockResolvedValue(
        generateAccountBalance([
          faker.finance.ethereumAddress(),
          faker.finance.ethereumAddress(),
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

      const expectedValue =
        mockedAccountBalance.total[progressCheckerSetup.symbol];
      expect(result.abuseDetected).toBe(false);
      expect(result.score).toBe(expectedValue);
      expect(result.token_balance).toBe(expectedValue);
    });
  });

  describe('abuse detection', () => {
    const checkerSetup = generateHoldingCheckerSetup();
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      checkerSetup,
    );

    beforeEach(() => {
      resultsChecker.ethDepositAddresses.clear();
    });

    it('should return zeros if abuse detected', async () => {
      mockedExchangeApiClient.fetchDepositAddress.mockResolvedValue(
        faker.finance.ethereumAddress(),
      );

      const mockedAccountBalance = generateAccountBalance([
        checkerSetup.symbol,
      ]);
      const expectedBalance = mockedAccountBalance.total[checkerSetup.symbol];
      mockedExchangeApiClient.fetchBalance.mockResolvedValue(
        mockedAccountBalance,
      );

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );

      expect(normalResult.abuseDetected).toBe(false);
      expect(normalResult.score).toBe(expectedBalance);
      expect(normalResult.token_balance).toBe(expectedBalance);

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
      progressCheckerSetup = generateHoldingCheckerSetup();

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        progressCheckerSetup,
      );
    });

    it('should collect total balance for all checked participants', async () => {
      const nParticipants = faker.number.int({ min: 2, max: 5 });

      let expectedTotalBalance = 0;
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

        await resultsChecker.checkForParticipant(generateParticipantAuthKeys());
      }

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_balance).toBe(expectedTotalBalance);
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
    });
  });
});
