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

  return new Date(cancellationRequestTx.timestamp);
}
