import { ExchangeName } from '@/common/constants';

import { ExchangeApiAccessError, ExchangeApiClientError } from '../errors';
import { ExchangePermission } from '../types';

export class KucoinClientError extends ExchangeApiClientError {
  constructor(message: string) {
    super(message, ExchangeName.KUCOIN);
  }
}

export class KucoinApiError extends KucoinClientError {
  constructor(
    readonly code: string,
    readonly codeMsg: string,
  ) {
    super('API response error');
  }
}

export class KucoinApiAccessError extends ExchangeApiAccessError {
  constructor(permission: ExchangePermission, cause: string) {
    super(ExchangeName.KUCOIN, permission, cause);
  }
}
