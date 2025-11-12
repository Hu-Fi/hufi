import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { InvalidEvmAddressError } from '@/common/errors/web3';
import logger from '@/logger';
import {
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
} from '@/modules/exchange-api-keys';

import {
  CampaignAlreadyFinishedError,
  CampaignNotStartedError,
  CampaignCancelledError,
  CampaignNotFoundError,
  InvalidCampaign,
  UserIsNotParticipatingError,
  CampaignJoinLimitedError,
} from './campaigns.errors';

@Catch(
  CampaignNotFoundError,
  InvalidCampaign,
  CampaignAlreadyFinishedError,
  CampaignNotStartedError,
  CampaignCancelledError,
  CampaignJoinLimitedError,
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
  InvalidEvmAddressError,
  UserIsNotParticipatingError,
)
export class CampaignsControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: CampaignsControllerErrorsFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.UNPROCESSABLE_ENTITY;
    let message: string = exception.message;
    if (exception instanceof InvalidCampaign) {
      message = exception.details;
    } else if (exception instanceof InvalidEvmAddressError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof CampaignJoinLimitedError) {
      message = `${exception.message}. ${exception.detail}`;
    }

    return response.status(status).json({
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
