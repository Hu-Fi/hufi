import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';
import { ExchangeApiClientError } from '@/modules/exchange/errors';
import { UserNotFoundError } from '@/modules/users';

import {
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
} from './exchange-api-key.error';

@Catch(
  UserNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
  ExchangeApiClientError,
)
export class ExchangeApiKeysControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: ExchangeApiKeysControllerErrorsFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof UserNotFoundError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (
      exception instanceof IncompleteKeySuppliedError ||
      exception instanceof KeyAuthorizationError
    ) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof ExchangeApiClientError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
    }

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
