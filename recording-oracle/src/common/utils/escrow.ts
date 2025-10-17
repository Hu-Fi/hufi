import { TransactionUtils } from '@human-protocol/sdk';

export async function getCancellationRequestDate(
  chainId: number,
  campaignAddress: string,
): Promise<Date> {
  const [cancellationRequestTx] = await TransactionUtils.getTransactions({
    chainId,
    escrow: campaignAddress,
    method: 'requestCancellation',
  });
  if (!cancellationRequestTx) {
    throw new Error('No cancellation tx in subgraph');
  }

  /**
   * Value in seconds returned as string from subgraph
   */
  const cancellationRequestedAt = Number(cancellationRequestTx.timestamp);

  return new Date(cancellationRequestedAt * 1000);
}
