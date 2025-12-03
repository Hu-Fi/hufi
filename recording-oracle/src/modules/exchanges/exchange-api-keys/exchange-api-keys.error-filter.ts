import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { BaseErrorResponse } from '@/common/types';
import logger from '@/logger';
import { UserNotFoundError } from '@/modules/users';

import {
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
} from './exchange-api-keys.errors';
import {
  ExchangeApiClientError,
  IncompleteKeySuppliedError,
} from '../api-client';

@Catch(
  UserNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
  ExchangeApiClientError,
  ExchangeApiKeyNotFoundError,
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

    const responseData: BaseErrorResponse = {
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (
      exception instanceof UserNotFoundError ||
      exception instanceof IncompleteKeySuppliedError
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (exception instanceof KeyAuthorizationError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      responseData.details = {
        missing_permissions: exception.missingPermissions,
      };
    } else if (exception instanceof ExchangeApiClientError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
    } else if (exception instanceof ExchangeApiKeyNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    }

    return response.status(status).json(responseData);
  }
}
