import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { BaseErrorResponse } from '@/common/types';
import { transformKeysFromCamelToSnake } from '@/common/utils/case-converter';
import logger from '@/logger';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private readonly logger = logger.child({ context: ExceptionFilter.name });

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody: BaseErrorResponse & { validation_errors?: string[] } = {
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        responseBody.message = exceptionResponse;
      } else {
        Object.assign(
          responseBody,
          {
            message: exception.message,
          },
          transformKeysFromCamelToSnake(exceptionResponse),
        );
      }
    } else {
      this.logger.error('Unhandled exception', {
        error: exception,
        path: request.url,
      });
    }

    response.removeHeader('Cache-Control');

    response.status(status).json(responseBody);
  }
}
