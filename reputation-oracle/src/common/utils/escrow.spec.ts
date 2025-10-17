jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { ITransaction, TransactionUtils } from '@human-protocol/sdk';

import * as escrowUtils from './escrow';

const mockedTransactionUtils = jest.mocked(TransactionUtils);

describe('Escrow utilities', () => {
  describe('getCancellationRequestDate', () => {
    const chainId = faker.number.int();
    const campaignAddress = faker.finance.ethereumAddress();

    it('should call with correct params and throw when no cancellation tx in subgraph', async () => {
      mockedTransactionUtils.getTransactions.mockResolvedValueOnce([]);

      let thrownError;
      try {
        await escrowUtils.getCancellationRequestDate(chainId, campaignAddress);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe('No cancellation tx in subgraph');

      expect(mockedTransactionUtils.getTransactions).toHaveBeenCalledTimes(1);
      expect(mockedTransactionUtils.getTransactions).toHaveBeenCalledWith({
        chainId,
        escrow: campaignAddress,
        method: 'requestCancellation',
      });
    });

    it('should return cancellation request date', async () => {
      const mockedTimestamp = Math.round(faker.date.anytime().valueOf() / 1000);

      mockedTransactionUtils.getTransactions.mockResolvedValueOnce([
        {
          timestamp: mockedTimestamp.toString(),
        } as unknown as ITransaction, // types mismatch in SDK
      ]);

      const crDate = await escrowUtils.getCancellationRequestDate(
        chainId,
        campaignAddress,
      );

      expect(crDate).toEqual(new Date(mockedTimestamp * 1000));
    });
  });
});
