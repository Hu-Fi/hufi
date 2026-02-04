import { ExchangeName } from '@/common/constants';

import { ExchangeApiAccessError, ExchangeApiClientError } from '../errors';
import { ExchangePermission } from '../types';

export class BigoneClientError extends ExchangeApiClientError {
  constructor(message: string) {
    super(message, ExchangeName.BIGONE);
  }
}

export class BigoneAccessError extends ExchangeApiAccessError {
  constructor(permission: ExchangePermission, cause: string) {
    super(ExchangeName.BIGONE, permission, cause);
  }
}
