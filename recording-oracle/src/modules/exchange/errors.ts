import { BaseError } from '@/common/errors/base';

export class ExchangeApiClientError extends BaseError {}

export class ExchangeApiAccessError extends ExchangeApiClientError {}
