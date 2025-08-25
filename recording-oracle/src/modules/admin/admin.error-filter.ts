import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';

@Catch()
export class AdminControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: AdminControllerErrorsFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error('Admin controller error', {
      path: request.url,
      error: exception,
    });

    return response.status(HttpStatus.OK).json({
      error: exception.message,
    });
  }
}
