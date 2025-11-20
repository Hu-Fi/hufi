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
import {
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
} from '@/modules/exchanges';

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

    const responseData: BaseErrorResponse = {
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof InvalidCampaign) {
      responseData.message = exception.details;
    } else if (exception instanceof InvalidEvmAddressError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof CampaignJoinLimitedError) {
      responseData.message = `${exception.message}. ${exception.detail}`;
    } else if (exception instanceof KeyAuthorizationError) {
      responseData.message = `${exception.message}. Missing: ${exception.missingPermissions.join(', ')}`;
    }

    return response.status(status).json(responseData);
  }
}
