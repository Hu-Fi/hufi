import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';

import { AuthError } from './auth.error';

@Catch(AuthError)
export class AuthControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: AuthControllerErrorsFilter.name,
  });

  catch(exception: AuthError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.UNAUTHORIZED;

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
