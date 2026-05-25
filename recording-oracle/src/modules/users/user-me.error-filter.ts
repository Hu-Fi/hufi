import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { BaseErrorResponse } from '@/common/types';
import logger from '@/logger';

import { InvalidUserPreferencesError } from './user-preferences.error';
import { UserNotFoundError } from './users.errors';

@Catch(UserNotFoundError, InvalidUserPreferencesError)
export class UserMeControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: UserMeControllerErrorsFilter.name,
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

    if (exception instanceof UserNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof InvalidUserPreferencesError) {
      status = HttpStatus.BAD_REQUEST;
    }

    return response.status(status).json(responseData);
  }
}
