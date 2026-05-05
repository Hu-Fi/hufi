import { faker } from '@faker-js/faker';
import { ITransaction, TransactionUtils } from '@human-protocol/sdk';
import { describe, expect, test, vi } from 'vitest';

import * as escrowUtils from './escrow';

vi.mock('@human-protocol/sdk');

const mockedTransactionUtils = vi.mocked(TransactionUtils);

describe('Escrow utilities', () => {
  describe('getCancellationRequestDate', () => {
    const chainId = faker.number.int();
    const campaignAddress = faker.finance.ethereumAddress();

    test('should call with correct params and throw when no cancellation tx in subgraph', async () => {
      mockedTransactionUtils.getTransactions.mockResolvedValueOnce([]);

      let thrownError: any;
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

    test('should return cancellation request date', async () => {
      const mockedTimestamp = faker.date.anytime().valueOf();

      mockedTransactionUtils.getTransactions.mockResolvedValueOnce([
        {
          timestamp: mockedTimestamp,
        } as ITransaction,
      ]);

      const crDate = await escrowUtils.getCancellationRequestDate(
        chainId,
        campaignAddress,
      );

      expect(crDate).toEqual(new Date(mockedTimestamp));
    });
  });
});
