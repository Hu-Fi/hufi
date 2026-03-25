import { BaseError } from '@/common/errors/base';

export class MaxParticipationsError extends BaseError {
  constructor(
    readonly campaignId: string,
    readonly nParticipants: number,
  ) {
    super('Campaign has reached the maximum number of participants');
  }
}
