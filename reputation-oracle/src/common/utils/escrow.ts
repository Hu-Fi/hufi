import { TransactionUtils } from '@human-protocol/sdk';

/**
 * TODO: replace it with property from Escrow entity once available in subgraph
 */
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
