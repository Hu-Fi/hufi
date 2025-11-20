import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import { ExchangeApiClient, ExchangesService } from '@/modules/exchanges';
import { generateAccountBalance } from '@/modules/exchanges/fixtures';

import {
  generateHoldingCheckerSetup,
  generateParticipantInfo,
} from './fixtures';
import { HoldingProgressChecker } from './holding';
import { CampaignProgressCheckerSetup, ParticipantInfo } from './types';

const mockedExchangeApiClient = createMock<ExchangeApiClient>();
const mockedExchangesService = createMock<ExchangesService>();

class TestCampaignProgressChecker extends HoldingProgressChecker {
  override ethDepositAddresses = new Set<string>();
}

describe('HoldingProgressChecker', () => {
  beforeEach(() => {
    mockedExchangesService.getClientForUser.mockResolvedValue(
      mockedExchangeApiClient,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
      generateHoldingCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  describe('checkForParticipant', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;
    let participantInfo: ParticipantInfo;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateHoldingCheckerSetup();
      participantInfo = generateParticipantInfo();

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangesService,
        progressCheckerSetup,
      );

      mockedExchangeApiClient.fetchBalance.mockResolvedValue(
        // adjust currency code to avoid overlaps with checker setup
        generateAccountBalance([`${faker.finance.currencyCode()}0`]),
      );
    });

    it('should properly init api client', async () => {
      const resultsChecker = new TestCampaignProgressChecker(
        mockedExchangesService,
        progressCheckerSetup,
      );

      await resultsChecker.checkForParticipant(participantInfo);

      expect(mockedExchangesService.getClientForUser).toHaveBeenCalledTimes(1);
      expect(mockedExchangesService.getClientForUser).toHaveBeenCalledWith(
        participantInfo.id,
        progressCheckerSetup.exchangeName,
      );
    });

    it('should return zeros when no token on balance', async () => {
      const result = await resultsChecker.checkForParticipant(
        generateParticipantInfo(),
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

      const result = await resultsChecker.checkForParticipant(participantInfo);

      const expectedValue =
        mockedAccountBalance.total[progressCheckerSetup.symbol];
      expect(result.abuseDetected).toBe(false);
      expect(result.score).toBe(expectedValue);
      expect(result.token_balance).toBe(expectedValue);
    });
  });

  describe('abuse detection', () => {
    const progressCheckerSetup = generateHoldingCheckerSetup();
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
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

      mockedExchangeApiClient.fetchBalance.mockResolvedValue(
        generateAccountBalance([progressCheckerSetup.symbol]),
      );
      const abuseResult = await resultsChecker.checkForParticipant(
        generateParticipantInfo(),
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
        mockedExchangesService,
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

        await resultsChecker.checkForParticipant(generateParticipantInfo());
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
        generateParticipantInfo(),
      );
      await resultsChecker.checkForParticipant(generateParticipantInfo());

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_balance).toBe(normalResult.token_balance);
    });
  });
});
