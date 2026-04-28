import { ExchangeName } from '@/common/constants';

import { ExchangeApiAccessError, ExchangeApiClientError } from '../errors';
import { ExchangePermission } from '../types';
import { ApiPermissionErrorCode } from './constants';

export class KrakenClientError extends ExchangeApiClientError {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message, ExchangeName.KRAKEN);
  }
}

export class KrakenApiAccessError extends ExchangeApiAccessError {
  constructor(permission: ExchangePermission, cause: string) {
    super(ExchangeName.KRAKEN, permission, cause);
  }
}

export class ApiPermissionError extends KrakenClientError {
  constructor(errorCode: ApiPermissionErrorCode) {
    super('API permission denied', errorCode);
  }
}
