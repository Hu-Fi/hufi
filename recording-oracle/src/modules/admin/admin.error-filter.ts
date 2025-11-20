import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { BaseErrorResponse } from '@/common/types';
import logger from '@/logger';

@Catch()
export class AdminControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: AdminControllerErrorsFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error('Admin controller error', {
      path: request.url,
      error: exception,
    });

    const responseData: BaseErrorResponse = {
      message: 'Failed to execute admin op',
      timestamp: new Date().toISOString(),
      path: request.url,
      details: exception,
    };
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(responseData);
  }
}
