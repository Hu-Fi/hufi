import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';
import { ExchangeApiKeyNotFoundError } from '@/modules/exchange-api-keys';

import {
  CampaignNotFoundError,
  InvalidCampaignStatusError,
  InvalidManifestError,
} from './campaigns.errors';

@Catch(
  CampaignNotFoundError,
  ExchangeApiKeyNotFoundError,
  InvalidCampaignStatusError,
  InvalidManifestError,
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

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
