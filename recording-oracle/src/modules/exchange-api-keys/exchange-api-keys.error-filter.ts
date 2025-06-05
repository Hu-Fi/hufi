import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';
import { UserNotFoundError } from '@/modules/users';

@Catch(UserNotFoundError)
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
    }

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
