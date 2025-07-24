import { EscrowStatus } from '@human-protocol/sdk';

export type ReadableEscrowStatus = keyof typeof EscrowStatus;

export const READABLE_ESCROW_STATUSES = Object.keys(EscrowStatus).filter(
  (key) => isNaN(Number(key)),
) as ReadableEscrowStatus[];
