import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { InvalidEvmAddressError } from '@/common/errors/web3';
import { BaseErrorResponse } from '@/common/types';
import logger from '@/logger';

import { AuthError } from './auth.errors';

@Catch(AuthError, InvalidEvmAddressError)
export class AuthControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: AuthControllerErrorsFilter.name,
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

    if (exception instanceof InvalidEvmAddressError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof AuthError) {
      status = HttpStatus.UNAUTHORIZED;
    }

    return response.status(status).json(responseData);
  }
}
