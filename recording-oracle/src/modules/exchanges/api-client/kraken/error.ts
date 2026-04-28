import { ExchangeName } from '@/common/constants';
import { BaseError } from '@/common/errors/base';

import { ExchangeApiAccessError, ExchangeApiClientError } from '../errors';
import { ExchangePermission } from '../types';

export class KrakenClientError extends ExchangeApiClientError {
  constructor(message: string) {
    super(message, ExchangeName.KRAKEN);
  }
}

export class KrakenApiError extends KrakenClientError {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

export class KrakenApiAccessError extends ExchangeApiAccessError {
  constructor(permission: ExchangePermission, cause: string) {
    super(ExchangeName.KRAKEN, permission, cause);
  }
}

export class ReportProcessingError extends BaseError {
  constructor(cause: unknown) {
    super('Failed to process report', cause);
  }
}
