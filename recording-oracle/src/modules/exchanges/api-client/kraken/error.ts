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
  constructor(readonly code: string) {
    super('API response error');
  }
}

export class KrakenApiAccessError extends ExchangeApiAccessError {
  constructor(permission: ExchangePermission, cause: string) {
    super(ExchangeName.KRAKEN, permission, cause);
  }
}

export class KrakenApiKeyNonceWindowError extends KrakenClientError {
  constructor(nonce_window: number) {
    super(`API key nonce window is too small: ${nonce_window}`);
  }
}

export class ReportProcessingError extends BaseError {
  constructor(cause: unknown) {
    super('Failed to process report', cause);
  }
}
