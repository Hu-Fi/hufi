import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';
import {
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
} from '@/modules/exchange-api-keys';

import {
  CampaignAlreadyFinishedError,
  CampaignNotFoundError,
  InvalidCampaign,
} from './campaigns.errors';

@Catch(
  CampaignNotFoundError,
  InvalidCampaign,
  CampaignAlreadyFinishedError,
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
)
export class CampaignsControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: CampaignsControllerErrorsFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.UNPROCESSABLE_ENTITY;

    let message: string = exception.message;
    if (exception instanceof InvalidCampaign) {
      message = exception.details;
    }

    return response.status(status).json({
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
